#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
中興大學課程資料自動爬取程式
定期爬取各學制的課程資料並儲存為JSON格式
"""

import json
import logging
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Optional, Tuple

import requests

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
    
    def _clean_and_repair_json(self, text: str) -> str:
        """
        清理並修補 JSON 文本
        
        處理問題：
        1. 移除控制字符 (ASCII 0-31, 127-159)
        2. 截取 JSON 主體 (第一個 '{' 到最後一個 '}')
        3. 修復各種 JSON 格式異常
        
        Args:
            text: 原始文本
            
        Returns:
            清理並修補後的文本
        """
        # 移除所有 ASCII 控制字符
        cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
        
        # 截取 JSON 主體 (從第一個 '{' 到最後一個 '}')
        first_brace = cleaned.find('{')
        last_brace = cleaned.rfind('}')
        
        if first_brace != -1 and last_brace != -1:
            cleaned = cleaned[first_brace:last_brace + 1]
        
        # 修復常見的 JSON 格式錯誤
        # 1. 修復冒號後直接逗號的情況: "key":, -> "key":null,
        cleaned = re.sub(r':\s*,', ':null,', cleaned)
        # 2. 修復冒號後直接結束的情況: "key":} -> "key":null}
        cleaned = re.sub(r':\s*}', ':null}', cleaned)
        # 3. 修復冒號後直接陣列結束: "key":] -> "key":null]
        cleaned = re.sub(r':\s*]', ':null]', cleaned)
        # 4. 移除陣列開頭的多餘逗號: [,2,3] -> [2,3]
        cleaned = re.sub(r'\[\s*,+\s*', '[', cleaned)
        # 5. 將連續逗號壓成一個: [2,,3] -> [2,3]
        cleaned = re.sub(r',\s*,+', ',', cleaned)
        
        return cleaned
    
    def _parse_json_response(self, text: str, career_name: str) -> Optional[Dict]:
        """
        解析 JSON 回應，包含清理和救援機制
        
        Args:
            text: 原始回應文本
            career_name: 學制名稱（用於日誌）
            
        Returns:
            解析成功返回字典，失敗返回 None
        """
        # 清理並修補 JSON 文本
        cleaned_text = self._clean_and_repair_json(text)
        
        try:
            data = json.loads(cleaned_text)
            self.logger.info(f"{career_name} 課程資料解析成功，共 {len(data)} 筆資料")
            return data
        except json.JSONDecodeError as e:
            self.logger.warning(f"{career_name} 初次解析失敗，嘗試進階救援: {e}")
            return self._rescue_json_parsing(cleaned_text, career_name)
    
    def _rescue_json_parsing(self, text: str, career_name: str) -> Optional[Dict]:
        """
        JSON 解析失敗時的救援機制
        
        Args:
            text: 清理後的文本
            career_name: 學制名稱（用於日誌）
            
        Returns:
            救援成功返回字典，失敗返回 None
        """
        # 嘗試提取最外層的 JSON 物件
        brace_match = re.search(r'\{.*\}', text, flags=re.S)
        if not brace_match:
            self.logger.error(f"{career_name} 無法找到有效的 JSON 結構")
            return None
        
        rescue_text = brace_match.group(0)
        # 確保在最後一個 '}' 處結束
        last_brace = rescue_text.rfind('}')
        if last_brace != -1:
            rescue_text = rescue_text[:last_brace + 1]
        
        try:
            data = json.loads(rescue_text)
            self.logger.info(f"{career_name} 救援成功，共 {len(data)} 筆資料")
            return data
        except json.JSONDecodeError as e:
            self.logger.error(f"{career_name} 救援失敗: {e}")
            return None
    
    def _save_raw_response(self, career: str, content: str):
        """
        保存原始回應內容用於調試
        
        Args:
            career: 學制代碼
            content: 原始內容
        """
        try:
            filename = f"raw_{career}_failed.txt"
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
            課程資料字典，失敗時返回 None
        """
        url = f"{self.base_url}?p_career={career}"
        career_name = self.career_mapping.get(career, career)
        
        try:
            self.logger.info(f"開始爬取 {career_name} 課程資料...")
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # 解析 JSON 回應
            data = self._parse_json_response(response.text, career_name)
            
            # 如果解析失敗，保存原始回應以供調試
            if data is None:
                self._save_raw_response(career, response.text)
            
            return data
                
        except requests.exceptions.RequestException as e:
            self.logger.error(f"{career_name} 網路請求失敗: {e}")
            return None
        except Exception as e:
            self.logger.error(f"{career_name} 未預期錯誤: {e}")
            return None
    
    def _crawl_single_career(self, career: str) -> Tuple[str, bool]:
        """
        爬取並儲存單一學制的課程資料（用於並行執行）
        
        Args:
            career: 學制代碼
            
        Returns:
            (學制名稱, 是否成功) 的元組
        """
        career_name = self.career_mapping[career]
        
        # 爬取資料
        data = self.fetch_course_data(career)
        
        # 儲存資料
        if data:
            success = self.save_course_data(career, data)
            return (career_name, success)
        return (career_name, False)
    
    def save_course_data(self, career: str, data: Dict) -> bool:
        """
        儲存課程資料到檔案
        
        Args:
            career: 學制代碼
            data: 課程資料
            
        Returns:
            儲存成功返回True，失敗返回False
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
    
    def crawl_all_careers(self, parallel: bool = True, max_workers: int = 6) -> Dict[str, bool]:
        """
        爬取所有學制的課程資料
        
        Args:
            parallel: 是否使用並行爬取（預設 True）
            max_workers: 最大並行執行緒數（預設 6，對應 6 個學制）
            
        Returns:
            各學制爬取結果的字典
        """
        self.logger.info("=" * 50)
        self.logger.info(f"開始執行課程資料爬取任務 ({'並行模式' if parallel else '序列模式'}）")
        self.logger.info("=" * 50)
        
        results = {}
        
        if parallel:
            # 使用執行緒池並行爬取
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # 提交所有爬取任務
                future_to_career = {
                    executor.submit(self._crawl_single_career, career): career 
                    for career in self.career_mapping.keys()
                }
                
                # 收集結果
                for future in as_completed(future_to_career):
                    try:
                        career_name, success = future.result()
                        results[career_name] = success
                    except Exception as e:
                        career = future_to_career[future]
                        career_name = self.career_mapping[career]
                        self.logger.error(f"{career_name} 執行過程發生錯誤: {e}")
                        results[career_name] = False
        else:
            # 序列模式（原有邏輯）
            for career, career_name in self.career_mapping.items():
                data = self.fetch_course_data(career)
                results[career_name] = self.save_course_data(career, data) if data else False
                time.sleep(2)  # 序列模式下保持延遲
        
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
    """主程式入口"""
    import sys
    
    # 檢查是否指定序列模式
    parallel = '--sequential' not in sys.argv
    
    crawler = NCHUCourseCrawler()
    results = crawler.crawl_all_careers(parallel=parallel)
    
    # 根據爬取結果設定退出碼
    exit(0 if all(results.values()) else 1)


if __name__ == "__main__":
    main()
