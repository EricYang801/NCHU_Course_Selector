#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
中興大學課程資料自動爬取程式
定期爬取各學制的課程資料並儲存為JSON格式
"""

import json
import os
import logging
import re
from typing import Dict, Optional, Any
import time
import requests


class NCHUCourseCrawler:
    """中興大學課程爬蟲"""

    def __init__(self, data_dir: str = "course-helper-web/public/data"):
        """
        初始化爬取器

        Args:
            data_dir: 資料儲存目錄
        """
        # 對中興大學課程 API 依學制（課程種類）逐一發送 GET 請求
        self.base_url = "https://onepiece.nchu.edu.tw/cofsys/plsql/json_for_course"
        self.data_dir = data_dir
        self.career_mapping = {
            "U": "學士班",
            "O": "通識加體育課",
            "N": "進修部",
            "W": "在職專班",
            "G": "碩士班",
            "D": "博士班",
        }

        # 設定日誌
        self._setup_logging()

        # 確保資料目錄存在
        os.makedirs(self.data_dir, exist_ok=True)

    def _setup_logging(self):
        """設定日誌系統"""
        log_format = "%(asctime)s - %(levelname)s - %(message)s"
        logging.basicConfig(
            level=logging.INFO,
            format=log_format,
            handlers=[
                logging.FileHandler("course_crawler.log", encoding="utf-8"),
                logging.StreamHandler(),
            ],
        )
        self.logger = logging.getLogger(__name__)

    def _clean_json_text(self, text: str) -> str:
        # 先把常見空白控制字元換空白
        text = re.sub(r"[\t\r\n]+", " ", text)

        # 移除其他控制字元
        cleaned = re.sub(r"[\x00-\x08\x0b-\x1f\x7f-\x9f]", "", text)

        # 找 JSON 起點：'[' 或 '{'
        first_obj = cleaned.find("{")
        first_arr = cleaned.find("[")
        starts = [i for i in [first_obj, first_arr] if i != -1]
        if starts:
            cleaned = cleaned[min(starts) :]

        # 找 JSON 終點：']' 或 '}'
        last_obj = cleaned.rfind("}")
        last_arr = cleaned.rfind("]")
        end = max(last_obj, last_arr)
        if end != -1:
            cleaned = cleaned[: end + 1]

        return cleaned

    def _repair_common_corruption(self, text: str) -> str:
        repaired = text

        # (A) 開頭多餘逗號
        repaired = re.sub(r"^\s*,+\s*", "", repaired)

        # (B) 陣列開頭多逗號
        repaired = re.sub(r"\[\s*,+\s*", "[", repaired)

        # (C) 連續逗號
        repaired = re.sub(r",\s*,+", ",", repaired)

        # (D) 冒號後缺值 -> null
        repaired = re.sub(r":\s*(?=,|\}|\])", ": null", repaired)

        # (E) 尾逗號（可選，常見）
        repaired = re.sub(r",\s*]", "]", repaired)
        repaired = re.sub(r",\s*}", "}", repaired)

        return repaired

    def _save_raw_response(self, career: str, content: str, status: str) -> None:
        """
        保存原始回應內容用於調試

        Args:
            career: 學制代碼
            content: 原始內容
            status: 狀態標記
        """
        # 使用固定檔名用於調試，不含時間戳記
        filename = f"raw_{career}_{status}.txt"
        filepath = os.path.join(self.data_dir, filename)

        try:
            with open(filepath, "w", encoding="utf-8") as file:
                file.write(content)
            self.logger.info("原始回應已保存至: %s", filepath)
        except (OSError, UnicodeError) as exc:
            # OSError: 路徑/權限/磁碟問題；UnicodeError: 編碼寫入問題
            self.logger.error("保存原始回應失敗: %s", exc)

    def fetch_course_data(self, career: str) -> Optional[Dict[str, Any]]:
        """
        爬取指定學制的課程資料

        Args:
            career: 學制代碼 (U, O, N, W, G, D)

        Returns:
            課程資料字典，失敗時回傳 None
        """
        url = f"{self.base_url}?p_career={career}"
        career_name = self.career_mapping.get(career, career)

        try:
            self.logger.info("開始爬取 %s 課程資料...", career_name)

            response = requests.get(url, timeout=30)
            response.raise_for_status()  # 4xx/5xx 直接丟 RequestException (HTTPError)

            cleaned_text = self._clean_json_text(response.text)

            try:
                # 進一步修補常見破損再解析
                repaired_text = self._repair_common_corruption(cleaned_text)
                data: Dict[str, Any] = json.loads(repaired_text)
                self.logger.info(
                    "%s 課程資料爬取成功，共 %s 筆資料", career_name, len(data)
                )
                return data

            except json.JSONDecodeError as exc:
                # 嘗試進階救援：只擷取最外層 { ... } 區段後再解析
                self.logger.warning(
                    "%s 第一次解析失敗，嘗試進階救援: %s", career_name, exc
                )

                brace_match = re.search(r"\{.*\}", cleaned_text, flags=re.S)
                if brace_match:
                    rescue_text = brace_match.group(0)
                    # 再次截斷到最後一個 '}'（避免結尾殘留）
                    last_brace = rescue_text.rfind("}")
                    if last_brace != -1:
                        rescue_text = rescue_text[: last_brace + 1]

                    try:
                        data = json.loads(rescue_text)
                        self.logger.info(
                            "%s 課程資料救援成功，共 %s 筆資料", career_name, len(data)
                        )
                        return data
                    except json.JSONDecodeError as exc2:
                        self.logger.error("%s 進階救援仍失敗: %s", career_name, exc2)
                else:
                    self.logger.error("%s 無法找到可疑 JSON 主體以救援", career_name)

                # 保存原始回應以供調試
                self._save_raw_response(career, response.text, "failed")
                return None

        except requests.exceptions.RequestException as exc:
            self.logger.error("%s 網路請求失敗: %s", career_name, exc)
            return None

        except (ValueError, TypeError) as exc:
            # 你的 clean/repair 或後續處理有可能丟 ValueError/TypeError（看你實作）
            self.logger.error("%s 資料處理失敗: %s", career_name, exc)
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
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            self.logger.info("%s資料已儲存至:%s", career_name, filepath)
            return True

        except (OSError, ValueError) as e:
            self.logger.error("儲存 %s 資料失敗: %s", career_name, e)
            return False

    def crawl_all_careers(self) -> Dict[str, bool]:
        """
        爬取所有學制的課程資料

        Returns:
            各學制爬取結果的字典
        """
        results: Dict[str, bool] = {}

        self.logger.info("%s", "=" * 50)
        self.logger.info("%s", "開始執行課程資料爬取任務")
        self.logger.info("%s", "=" * 50)

        # 直接迭代 dict（不呼叫 .keys()）
        for career, career_name in self.career_mapping.items():
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

    def _print_summary(self, results: Dict[str, bool]) -> None:
        """輸出爬取結果摘要"""
        self.logger.info("%s", "=" * 50)
        self.logger.info("%s", "爬取任務執行完成")
        self.logger.info("%s", "=" * 50)

        successful = sum(1 for success in results.values() if success)
        total = len(results)

        self.logger.info("總計: %s 個學制", total)
        self.logger.info("成功: %s 個", successful)
        self.logger.info("失敗: %s 個", total - successful)
        self.logger.info("")

        for career_name, success in results.items():
            status = "✓ 成功" if success else "✗ 失敗"
            self.logger.info("%s: %s", career_name, status)


def main():
    """主程式"""
    crawler = NCHUCourseCrawler()
    crawler.crawl_all_careers()


if __name__ == "__main__":
    main()
