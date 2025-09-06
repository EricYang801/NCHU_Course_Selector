#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
中興大學課程資料自動爬取程式
定期爬取各學制的課程資料並儲存為JSON格式
"""

import requests
import json
import os
import logging
import re
from datetime import datetime
from typing import Dict, Optional
import time

class NCHUCourseCrawler:
    """中興大學課程爬取器"""
    
    def __init__(self, data_dir: str = "course-helper-web/public/data"):
        """
        初始化爬取器
        
        Args:
            data_dir: 資料儲存目錄
        """
        self.base_url = "https://onepiece.nchu.edu.tw/cofsys/plsql/json_for_course"
        self.data_dir = data_dir
        self.career_mapping = {
            'U': '學士班',
            'O': '通識加體育課',
            'N': '進修部',
            'W': '在職專班',
            'G': '碩士班',
            'D': '博士班'
        }
        
        # 設定日誌
        self._setup_logging()
        
        # 確保資料目錄存在
        os.makedirs(self.data_dir, exist_ok=True)
    
    def _setup_logging(self):
        """設定日誌系統"""
        log_format = '%(asctime)s - %(levelname)s - %(message)s'
        logging.basicConfig(
            level=logging.INFO,
            format=log_format,
            handlers=[
                logging.FileHandler('course_crawler.log', encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def _clean_json_text(self, text: str) -> str:
        """
        清理 JSON 文本中的控制字符
        
        Args:
            text: 原始文本
            
        Returns:
            清理後的文本
        """
        # 移除所有 ASCII 控制字符 (0-31) 和 DEL + 擴展控制字符 (127-159)
        cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)

        # 有時候回應尾端會夾帶多餘符號 (例如 % 或其他雜訊)，導致 JSONDecodeError
        # 策略：截斷到最後一個 '}' 為止（確保最外層物件閉合），避免尾端殘留非 JSON 字元
        last_brace = cleaned.rfind('}')
        if last_brace != -1:
            trimmed = cleaned[:last_brace + 1]
        else:
            trimmed = cleaned  # 若找不到就維持原樣，後續會在解析階段失敗並紀錄

        # 進一步檢查是否存在開頭雜訊：取第一個 '{' 之後的內容
        first_brace = trimmed.find('{')
        if first_brace > 0:
            trimmed = trimmed[first_brace:]

        return trimmed

    def _repair_common_corruption(self, text: str) -> str:
        """針對已知的 API JSON 資料異常模式進行修補。

        目前觀察到的問題：
        1. 陣列開頭出現多餘逗號: [ ,2,3] -> [2,3]
        2. 重複逗號: [2,,3] -> [2,3]
        3. time_parsed 區段內空白逗號組合導致解析失敗
        """
        repaired = text
        # 1. 移除陣列左中括號後緊跟的逗號與空白
        repaired = re.sub(r'\[\s*,+\s*', '[', repaired)
        # 2. 將連續兩個或以上逗號壓成一個
        repaired = re.sub(r',\s*,+', ',', repaired)
        return repaired
    
    def _save_raw_response(self, career: str, content: str, status: str):
        """
        保存原始回應內容用於調試
        
        Args:
            career: 學制代碼
            content: 原始內容
            status: 狀態標記
        """
        try:
            # 使用固定檔名用於調試，不含時間戳記
            filename = f"raw_{career}_{status}.txt"
            filepath = os.path.join(self.data_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            self.logger.info(f"原始回應已保存至: {filepath}")
        except Exception as e:
            self.logger.error(f"保存原始回應失敗: {e}")

    def fetch_course_data(self, career: str) -> Optional[Dict]:
        """
        爬取指定學制的課程資料
        
        Args:
            career: 學制代碼 (U, O, N, W, G, D)
            
        Returns:
            課程資料字典，失敗時回傳None
        """
        url = f"{self.base_url}?p_career={career}"
        career_name = self.career_mapping.get(career, career)
        
        try:
            self.logger.info(f"開始爬取 {career_name} 課程資料...")
            
            # 發送請求
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # 檢查回應內容
            if response.status_code == 200:
                # 清理回應文本中的控制字符
                cleaned_text = self._clean_json_text(response.text)
                
                try:
                    # 進一步修補常見破損再解析
                    repaired_text = self._repair_common_corruption(cleaned_text)
                    data = json.loads(repaired_text)
                    self.logger.info(f"{career_name} 課程資料爬取成功，共 {len(data)} 筆資料")
                    return data
                except json.JSONDecodeError as e:
                    # 嘗試進階救援：只擷取最外層 { ... } 區段後再解析
                    self.logger.warning(f"{career_name} 第一次解析失敗，嘗試進階救援: {e}")
                    brace_match = re.search(r'\{.*\}', cleaned_text, flags=re.S)
                    if brace_match:
                        rescue_text = brace_match.group(0)
                        # 再次截斷到最後一個 '}'（避免結尾殘留）
                        rescue_text = rescue_text[:rescue_text.rfind('}') + 1]
                        try:
                            data = json.loads(rescue_text)
                            self.logger.info(f"{career_name} 課程資料救援成功，共 {len(data)} 筆資料")
                            return data
                        except json.JSONDecodeError as e2:
                            self.logger.error(f"{career_name} 進階救援仍失敗: {e2}")
                    else:
                        self.logger.error(f"{career_name} 無法找到可疑 JSON 主體以救援")

                    # 保存原始回應以供調試
                    self._save_raw_response(career, response.text, "failed")
                    return None
            else:
                self.logger.error(f"{career_name} 課程資料爬取失敗，狀態碼: {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            self.logger.error(f"{career_name} 網路請求失敗: {e}")
            return None
        except json.JSONDecodeError as e:
            self.logger.error(f"{career_name} JSON 解析失敗: {e}")
            # 嘗試保存原始回應提供測試使用
            if 'response' in locals():
                self._save_raw_response(career, response.text, "failed")
            return None
        except Exception as e:
            self.logger.error(f"{career_name} 未預期錯誤: {e}")
            return None
    
    def save_course_data(self, career: str, data: Dict) -> bool:
        """
        儲存課程資料到檔案
        
        Args:
            career: 學制代碼
            data: 課程資料
            
        Returns:
            儲存成功回傳True，失敗回傳False
        """
        career_name = self.career_mapping.get(career, career)
        # 使用固定檔名，不含時間戳記
        filename = f"{career}_{career_name}.json"
        filepath = os.path.join(self.data_dir, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"{career_name} 資料已儲存至: {filepath}")
            return True
            
        except Exception as e:
            self.logger.error(f"儲存 {career_name} 資料失敗: {e}")
            return False
    
    def crawl_all_careers(self) -> Dict[str, bool]:
        """
        爬取所有學制的課程資料
        
        Returns:
            各學制爬取結果的字典
        """
        results = {}
        
        self.logger.info("=" * 50)
        self.logger.info("開始執行課程資料爬取任務")
        self.logger.info("=" * 50)
        
        for career in self.career_mapping.keys():
            career_name = self.career_mapping[career]
            
            # 爬取資料
            data = self.fetch_course_data(career)
            
            if data is not None:
                # 儲存資料
                success = self.save_course_data(career, data)
                results[career_name] = success
            else:
                results[career_name] = False
            
            # 避免對伺服器造成過大負擔
            time.sleep(2)
        
        # 輸出結果摘要
        self._print_summary(results)
        return results
    
    def _print_summary(self, results: Dict[str, bool]):
        """輸出爬取結果摘要"""
        self.logger.info("=" * 50)
        self.logger.info("爬取任務執行完成")
        self.logger.info("=" * 50)
        
        successful = sum(1 for success in results.values() if success)
        total = len(results)
        
        self.logger.info(f"總計: {total} 個學制")
        self.logger.info(f"成功: {successful} 個")
        self.logger.info(f"失敗: {total - successful} 個")
        self.logger.info("")
        
        for career_name, success in results.items():
            status = "✓ 成功" if success else "✗ 失敗"
            self.logger.info(f"{career_name}: {status}")

def main():
    """主程式"""
    crawler = NCHUCourseCrawler()
    
    # 執行爬取任務
    results = crawler.crawl_all_careers()
    
    # 檢查是否所有任務都成功
    if all(results.values()):
        exit(0)  # 成功
    else:
        exit(1)  # 部分或全部失敗


if __name__ == "__main__":
    main()
