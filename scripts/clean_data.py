#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
import sys

def clean_data():
    """清理數據，統一描述格式"""
    try:
        print('🧹 開始清理數據...')
        
        # 讀取原始數據
        data_path = '../data/data.json'
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f'📊 原始記錄數: {len(data["records"])}')
        
        cleaned_count = 0
        skipped_count = 0
        
        # 清理每筆記錄
        for record in data['records']:
            if not record.get('description'):
                skipped_count += 1
                continue
            
            # 檢查是否需要清理
            needs_cleaning = ('-' not in record['description'] and 
                            record.get('mainCategory'))
            
            if needs_cleaning:
                # 將格式從 "描述" 改為 "主類別-描述"
                old_description = record['description']
                record['description'] = f"{record['mainCategory']}-{old_description}"
                cleaned_count += 1
                
                print(f'🔄 清理記錄 {record["id"]}: "{old_description}" → "{record["description"]}"')
            else:
                skipped_count += 1
        
        # 保存清理後的數據
        with open(data_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print('✅ 數據清理完成！')
        print(f'📈 統計結果:')
        print(f'   - 總記錄數: {len(data["records"])}')
        print(f'   - 已清理: {cleaned_count} 筆')
        print(f'   - 跳過: {skipped_count} 筆')
        print(f'   - 備份文件: data_backup.json')
        
    except Exception as error:
        print(f'❌ 數據清理失敗: {error}')
        sys.exit(1)

if __name__ == '__main__':
    clean_data()
