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
    
    def __init__(self, data_dir: str = "../course_data"):
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
        # 這個策略已驗證可以成功解析中興大學的 API 回應
        cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
        
        return cleaned
    
    def _save_raw_response(self, career: str, content: str, status: str):
        """
        保存原始回應內容用於調試
        
        Args:
            career: 學制代碼
            content: 原始內容
            status: 狀態標記
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"raw_{career}_{status}_{timestamp}.txt"
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
            response = requests.get(url, timeout=30, verify="nchu_fullchain.pem")
            response.raise_for_status()
            
            # 檢查回應內容
            if response.status_code == 200:
                # 清理回應文本中的控制字符
                cleaned_text = self._clean_json_text(response.text)
                
                try:
                    data = json.loads(cleaned_text)
                    self.logger.info(f"{career_name} 課程資料爬取成功，共 {len(data)} 筆資料")
                    return data
                except json.JSONDecodeError as e:
                    self.logger.error(f"{career_name} 清理後的 JSON 解析仍失敗: {e}")
                    # 嘗試保存原始回應提供測試使用
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
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{career}_{career_name}_{timestamp}.json"
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
