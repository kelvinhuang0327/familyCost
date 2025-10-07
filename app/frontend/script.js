        // 數據存儲
        let records = [];
        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();
        
        // 月份篩選狀態
        let selectedDashboardMonth = null;
        let selectedListMonth = null;
        
        // 初始化當月份
        function initializeCurrentMonth() {
            const now = new Date();
            const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            selectedDashboardMonth = currentMonthStr;
            selectedListMonth = currentMonthStr;
            
            // 設置選擇器的預設值
            setTimeout(() => {
                const dashboardSelect = document.getElementById('dashboardMonthSelect');
                const listSelect = document.getElementById('listMonthSelect');
                if (dashboardSelect) {
                    dashboardSelect.value = currentMonthStr;
                }
                if (listSelect) {
                    listSelect.value = currentMonthStr;
                }
            }, 100);
            
            console.log('📅 初始化當月份:', currentMonthStr);
        }

        // 跨瀏覽器數據同步
        // syncInterval變量已移除 - 不再需要自動同步
        // localStorage緩存已移除 - 數據直接從JSON文件讀取

        // 服務器同步功能已移除 - 現在使用JSON文件存儲，不需要同步

        // 更新所有顯示
        function updateAllDisplays() {
            console.log('🔄 updateAllDisplays: 開始更新所有顯示');
            console.log('📊 當前records數量:', records.length);
            console.log('📊 records內容:', records.slice(0, 3)); // 顯示前3筆記錄
            
            // 初始化當月份（如果尚未初始化）
            if (selectedDashboardMonth === null || selectedListMonth === null) {
                initializeCurrentMonth();
            }
            
            updateStats();
            updateRecentRecords();
            updateAllRecords();
            updateCalendar();
            // updateDataStats(); // 已移除，避免覆蓋月份篩選統計
            updateMemberStats();
            
            console.log('✅ updateAllDisplays: 所有顯示更新完成');
        }

        // 獲取篩選後的記錄
        function getFilteredRecords(page = 'dashboard') {
            let selectedMonth = null;
            let isExplicitlyAll = false;
            
            if (page === 'dashboard') {
                selectedMonth = selectedDashboardMonth;
            } else if (page === 'list') {
                selectedMonth = selectedListMonth;
            }
            
            // 檢查是否明確選擇了「顯示全部」
            const selectElement = page === 'dashboard' ? 
                document.getElementById('dashboardMonthSelect') : 
                document.getElementById('listMonthSelect');
            
            if (selectElement && selectElement.value === '') {
                isExplicitlyAll = true;
            }
            
            // 如果明確選擇了「顯示全部」，返回所有記錄
            if (isExplicitlyAll) {
                return records;
            }
            
            // 如果沒有選擇月份，預設顯示當月份
            if (!selectedMonth) {
                const now = new Date();
                selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }
            
            const [year, month] = selectedMonth.split('-').map(Number);
            return records.filter(record => {
                const recordDate = new Date(convertDateToStandard(record.date));
                // 比較年份和月份，注意 getMonth() 返回 0-11，所以需要 +1
                return recordDate.getFullYear() === year && (recordDate.getMonth() + 1) === month;
            });
        }

        // 總覽頁面月份選擇
        function changeDashboardMonth() {
            const monthSelect = document.getElementById('dashboardMonthSelect');
            selectedDashboardMonth = monthSelect.value || null; // 空值時設為 null
            
            console.log('📅 總覽頁面選擇月份:', selectedDashboardMonth);
            updateStats();
            updateRecentRecords();
            updateMemberStats();
        }

        // 列表頁面月份選擇
        function changeListMonth() {
            const monthSelect = document.getElementById('listMonthSelect');
            selectedListMonth = monthSelect.value || null; // 空值時設為 null
            
            console.log('📅 列表頁面選擇月份:', selectedListMonth);
            filterRecords();
        }

        // 自動同步功能已移除 - 現在使用JSON文件存儲，不需要同步

        // 手動同步功能已移除 - 現在使用JSON文件存儲，不需要同步

        // 清除緩存功能已移除 - 現在使用JSON文件存儲，不需要緩存

        // 自動同步切換功能已移除 - 現在使用JSON文件存儲，不需要同步

        // 同步狀態顯示功能已移除 - 現在使用JSON文件存儲，不需要同步狀態

        // GitHub自動備份功能 - 已移除

        // 從JSON文件還原數據（GitHub還原功能已移除）
        async function restoreFromDatabase() {
            try {
                console.log('🔄 從JSON文件還原數據...');
                
                // 直接從JSON文件載入數據
                await loadDataFromFile();
                updateAllDisplays();
                
                console.log('✅ 成功從JSON文件還原數據');
                return true;
                
            } catch (error) {
                console.warn('⚠️ JSON文件還原失敗:', error.message);
                return false;
            }
        }
        
        // 檢查是否有2025年的記錄，如果有則切換到2025年
        function checkAndSwitchTo2025() {
            const has2025Records = records.some(record => {
                const recordDate = new Date(record.date);
                return recordDate.getFullYear() === 2025;
            });
            
            if (has2025Records) {
                currentYear = 2025;
                console.log('檢測到2025年記錄，切換日曆到2025年');
                updateCalendar();
            }
        }
        let importData = []; // 儲存要匯入的數據
        let deleteData = []; // 儲存要刪除的數據
        // let dataBackup = null; // 數據備份 - 已移除
        
        // 圖表相關變數
        let trendChart = null;
        let categoryChart = null;
        let memberChart = null;

        // 類別選項
        const categories = {
            income: ['醫療', '獎金', '投資收益', '房租收入', '借款收入', '代付收入', '其他收入'],
            expense: {
                '娛樂': [],
                '日常': [],
                '餐飲': [],
                '楊梅': [],
                '交通': [],
                '其他': [],
                '醫療': [],
                '禮物': [],
                '學費': []
            }
        };

        // 家庭成員
        const familyMembers = ['Kelvin', 'Phuong', 'Ryan', '家用'];

        // 固定支出提醒
        const recurringExpenses = [
            { name: '房租', amount: 15000, day: 1, member: '家用' },
            { name: '房貸', amount: 21454, day: 1, member: '家用' },
            { name: '手機費', amount: 1200, day: 15, member: 'Kelvin' },
            { name: '網路費', amount: 1598, day: 15, member: 'Phuong' }
        ];

        // Safari兼容性檢測和修復
        function detectAndFixSafari() {
            const userAgent = navigator.userAgent;
            const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
            
            if (isSafari) {
                console.log('🍎 檢測到Safari，執行兼容性修復...');
                
                // Safari緩存清除已移除 - 數據直接從JSON文件讀取
                
                // 添加Safari專用提示
                const safariNotice = document.createElement('div');
                safariNotice.id = 'safari-notice';
                safariNotice.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: #ff6b6b;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    z-index: 10000;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                `;
                safariNotice.innerHTML = `
                    🍎 Safari模式 | 
                    <button onclick="forceRefreshData()" style="background: white; color: #ff6b6b; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-left: 10px;">
                        強制刷新
                    </button>
                    <button onclick="this.parentElement.remove()" style="background: transparent; color: white; border: 1px solid white; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-left: 5px;">
                        ✕
                    </button>
                `;
                document.body.appendChild(safariNotice);
                
                // 5秒後自動隱藏
                setTimeout(() => {
                    if (safariNotice.parentElement) {
                        safariNotice.remove();
                    }
                }, 5000);
                
                console.log('✅ Safari兼容性修復完成');
            }
            
            return isSafari;
        }

        // 強制刷新數據（Safari專用）
        async function forceRefreshData() {
            console.log('🔄 Safari強制刷新數據...');
            
            try {
                // 直接從JSON文件讀取數據
                console.log('📡 從JSON文件強制刷新數據...');
                const response = await fetch(ENV_CONFIG.getApiBase() + '/api/records', {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && Array.isArray(result.records)) {
                        records = result.records;
                        console.log('✅ Safari強制刷新完成，載入', records.length, '筆記錄');
                        
                        // 更新所有顯示
                        updateStats();
                        updateRecentRecords();
                        updateAllRecords();
                        updateCalendar();
                        updateSyncStatus();
                        
                        console.log(`✅ Safari強制刷新成功，載入 ${records.length} 筆記錄`);
                        alert(`✅ Safari強制刷新成功！\n載入 ${records.length} 筆記錄`);
                    }
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                console.error('❌ Safari強制刷新失敗:', error);
                alert('❌ Safari強制刷新失敗，請檢查服務狀態');
            }
        }

        // 生成唯一ID的函數
        function generateUniqueId() {
            // 使用更可靠的ID生成方式：時間戳 + 隨機數 + 計數器
            const timestamp = Date.now().toString();
            const random = Math.random().toString(36).substr(2, 9);
            const counter = (generateUniqueId.counter = (generateUniqueId.counter || 0) + 1);
            return `${timestamp}_${random}_${counter}`;
        }

        // 環境配置
        const ENV_CONFIG = {
            // 檢測當前環境
            getEnvironment() {
                const hostname = window.location.hostname;
                if (hostname === 'localhost' || hostname === '127.0.0.1') {
                    return 'local';
                } else if (hostname.includes('vercel.app')) {
                    return 'vercel'; // Vercel 環境
                } else if (hostname.includes('onrender.com')) {
                    return 'render'; // Render 環境
                } else if (hostname.includes('github.io')) {
                    return 'sit'; // GitHub Pages 環境
                }
                return 'local'; // 默認本地環境
            },
            
            // 獲取API基礎URL
            getApiBase() {
                const env = this.getEnvironment();
                if (env === 'vercel') {
                    return window.location.origin; // Vercel 支持後端
                } else if (env === 'render') {
                    return window.location.origin; // Render 支持後端
                } else if (env === 'sit') {
                    return window.location.origin; // GitHub Pages 不支持後端
                } else {
                    return 'http://localhost:3001'; // 本地環境
                }
            },
            
            // 獲取後端URL
            getBackendUrl() {
                const env = this.getEnvironment();
                if (env === 'vercel') {
                    return window.location.origin; // Vercel 支持後端
                } else if (env === 'render') {
                    return window.location.origin; // Render 支持後端
                } else if (env === 'sit') {
                    return window.location.origin; // GitHub Pages 不支持後端
                } else {
                    return 'http://localhost:3001'; // 本地環境
                }
            }
        };

        // 檢查環境限制
        function checkEnvironmentLimitations() {
            const env = ENV_CONFIG.getEnvironment();
            const limitationNotice = document.getElementById('envLimitationNotice');

            if (env === 'sit' && limitationNotice) {
                limitationNotice.style.display = 'block';
                console.log('⚠️ GitHub Pages 環境限制：後端功能不可用');
            } else if (limitationNotice) {
                limitationNotice.style.display = 'none';
                if (env === 'vercel') {
                    console.log('✅ Vercel 環境：後端功能完全可用');
                } else if (env === 'render') {
                    console.log('✅ Render 環境：後端功能完全可用');
                } else if (env === 'local') {
                    console.log('✅ 本地環境：後端功能完全可用');
                }
            }
        }

        // 載入版本信息
        async function loadVersionInfo() {
            try {
                // 添加時間戳避免快取
                const timestamp = new Date().getTime();
                const response = await fetch(`data/version.json?t=${timestamp}`);
                const versionData = await response.json();
                
                const versionElement = document.getElementById('versionNumber');
                const footerVersionElement = document.getElementById('footerVersionNumber');
                
                if (versionElement) {
                    versionElement.textContent = versionData.version;
                    versionElement.title = `建構時間: ${versionData.buildTime}\nCommit: ${versionData.commitHash || 'N/A'}`;
                }
                
                if (footerVersionElement) {
                    footerVersionElement.textContent = versionData.version;
                    footerVersionElement.title = `建構時間: ${versionData.buildTime}\nCommit: ${versionData.commitHash || 'N/A'}`;
                }
                
                console.log('✅ 版本信息已載入:', versionData.version);
                console.log('🌍 當前環境:', ENV_CONFIG.getEnvironment());
                console.log('🔗 API地址:', ENV_CONFIG.getApiBase());
                
                // 檢查環境限制
                checkEnvironmentLimitations();
            } catch (error) {
                console.error('❌ 載入版本信息失敗:', error);
                const versionElement = document.getElementById('versionNumber');
                const footerVersionElement = document.getElementById('footerVersionNumber');
                
                if (versionElement) {
                    versionElement.textContent = '載入失敗';
                }
                
                if (footerVersionElement) {
                    footerVersionElement.textContent = '載入失敗';
                }
            }
        }

        // 檢查是否需要顯示滑動指示器（全局函數）
        function checkScrollable(element, indicator) {
            if (element && indicator) {
                const isScrollable = element.scrollWidth > element.clientWidth;
                indicator.style.display = isScrollable ? 'block' : 'none';
                console.log('🔍 滑動檢查:', element.className, '可滑動:', isScrollable, 'scrollWidth:', element.scrollWidth, 'clientWidth:', element.clientWidth);
            }
        }

        // 初始化滑動指示器
        function initializeSwipeIndicators() {
            const statsGrid = document.querySelector('.stats');
            const memberStatsGrid = document.querySelector('.member-stats-grid');
            const statsIndicator = document.getElementById('statsSwipeIndicator');
            const memberIndicator = document.getElementById('memberSwipeIndicator');
            
            // 添加滑動時的動態效果
            function addSwipeEffects(element) {
                if (!element) return;
                
                let isScrolling = false;
                
                element.addEventListener('scroll', function() {
                    if (!isScrolling) {
                        isScrolling = true;
                        element.style.transition = 'none';
                        
                        // 滑動時的效果
                        const cards = element.querySelectorAll('.stat-card');
                        cards.forEach((card, index) => {
                            const rect = card.getBoundingClientRect();
                            const center = window.innerWidth / 2;
                            const distance = Math.abs(rect.left + rect.width / 2 - center);
                            const scale = Math.max(0.9, 1 - distance / 200);
                            
                            card.style.transform = `scale(${scale})`;
                            card.style.zIndex = Math.round(scale * 10);
                        });
                        
                        setTimeout(() => {
                            isScrolling = false;
                            element.style.transition = '';
                        }, 100);
                    }
                });
            }
            
            // 初始檢查
            checkScrollable(statsGrid, statsIndicator);
            checkScrollable(memberStatsGrid, memberIndicator);
            
            // 添加滑動效果
            addSwipeEffects(statsGrid);
            addSwipeEffects(memberStatsGrid);
            
            // 初始化總支出統計滑動
            if (statsGrid) {
                initializeStatsSwipe();
            }
            
            // 監聽窗口大小變化
            window.addEventListener('resize', function() {
                checkScrollable(statsGrid, statsIndicator);
                checkScrollable(memberStatsGrid, memberIndicator);
            });
            
            // 監聽內容變化
            const observer = new MutationObserver(function() {
                checkScrollable(statsGrid, statsIndicator);
                checkScrollable(memberStatsGrid, memberIndicator);
            });
            
            if (statsGrid) observer.observe(statsGrid, { childList: true, subtree: true });
            if (memberStatsGrid) observer.observe(memberStatsGrid, { childList: true, subtree: true });
        }
        
        // 初始化總支出統計滑動功能
        function initializeStatsSwipe() {
            const statsGrid = document.querySelector('.stats');
            
            if (!statsGrid) return;
            
            let currentIndex = 1; // 預設顯示中間的卡片（第二個位置）
            
            // 滑動到指定位置
            function scrollToStats(index) {
                const cardWidth = 200; // 固定卡片寬度
                statsGrid.scrollTo({
                    left: index * cardWidth,
                    behavior: 'smooth'
                });
                currentIndex = index;
            }
            
            // 初始化時滑動到中間位置
            setTimeout(() => {
                scrollToStats(1);
            }, 200);
            
            // 監聽滑動事件
            statsGrid.addEventListener('scroll', () => {
                const cardWidth = 200; // 固定卡片寬度
                const scrollLeft = statsGrid.scrollLeft;
                const newIndex = Math.round(scrollLeft / cardWidth);
                
                if (newIndex !== currentIndex && newIndex >= 0 && newIndex < 4) {
                    currentIndex = newIndex;
                }
            });
            
            // 添加觸控滑動支持
            let startX = 0;
            let isScrolling = false;
            
            statsGrid.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isScrolling = false;
            });
            
            statsGrid.addEventListener('touchmove', (e) => {
                if (!isScrolling) {
                    const currentX = e.touches[0].clientX;
                    const diffX = Math.abs(currentX - startX);
                    
                    if (diffX > 10) {
                        isScrolling = true;
                    }
                }
            });
            
            statsGrid.addEventListener('touchend', () => {
                if (isScrolling) {
                    const cardWidth = 200; // 固定卡片寬度
                    const scrollLeft = statsGrid.scrollLeft;
                    const newIndex = Math.round(scrollLeft / cardWidth);
                    
                    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < 4) {
                        currentIndex = newIndex;
                    }
                }
            });
        }

        // 防止過度滾動的函數
        function preventOverScroll() {
            const container = document.querySelector('.container');
            if (!container) return;
            
            container.addEventListener('scroll', function() {
                const scrollTop = container.scrollTop;
                const scrollHeight = container.scrollHeight;
                const clientHeight = container.clientHeight;
                
                // 防止向上過度滾動
                if (scrollTop <= 0) {
                    container.scrollTop = 0;
                }
                
                // 防止向下過度滾動
                if (scrollTop + clientHeight >= scrollHeight) {
                    container.scrollTop = scrollHeight - clientHeight;
                }
            });
            
            // 防止觸控過度滾動
            container.addEventListener('touchstart', function(e) {
                const scrollTop = container.scrollTop;
                const scrollHeight = container.scrollHeight;
                const clientHeight = container.clientHeight;
                
                // 如果已經在頂部，阻止向上滑動
                if (scrollTop <= 0 && e.touches[0].clientY > e.touches[0].clientY) {
                    e.preventDefault();
                }
                
                // 如果已經在底部，阻止向下滑動
                if (scrollTop + clientHeight >= scrollHeight && e.touches[0].clientY < e.touches[0].clientY) {
                    e.preventDefault();
                }
            }, { passive: false });
        }

        // Excel 匯入功能
        let currentCompareData = null;
        // currentExcelImportData 已移除 - 使用統一的 currentCompareData

        // 初始化檔案上傳功能
        function initExcelUpload() {
            const fileInput = document.getElementById('excelFileInput');
            const uploadArea = document.getElementById('uploadArea');
            const uploadDescription = document.getElementById('uploadDescription');

            // 格式選擇事件已移除 - 只支援Excel格式

            // 檔案選擇事件
            fileInput.addEventListener('change', function(e) {
                if (e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0], 'excel');
                }
            });

            // 拖拽功能
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFileUpload(files[0], 'excel');
                }
            });

            // 點擊上傳區域
            uploadArea.addEventListener('click', function() {
                fileInput.click();
            });
        }

        // 處理檔案上傳
        async function handleFileUpload(file, format = 'excel') {
            console.log('📁 開始處理檔案上傳:', file.name);
            console.log('📁 檔案大小:', file.size, 'bytes');
            console.log('📁 檔案類型:', file.type);
            console.log('📁 匯入格式:', format);
            console.log('📁 API 地址:', ENV_CONFIG.getApiBase() + '/api/excel/compare');
            
            // 驗證檔案類型
            if (!file.name.match(/\.(xlsx|xls)$/i)) {
                alert(`❌ 請選擇 Excel 檔案 (.xlsx 或 .xls)`);
                return;
            }

            // 驗證檔案大小
            if (file.size > 10 * 1024 * 1024) {
                alert('❌ 檔案大小不能超過 10MB');
                return;
            }

            const formData = new FormData();
            formData.append('excelFile', file);
            formData.append('format', format); // 添加格式參數

            try {
                console.log('📡 開始發送請求到:', ENV_CONFIG.getApiBase() + '/api/excel/compare');
                console.log('📡 FormData 內容:', formData);
                console.log('📡 匯入格式:', format);
                
                const response = await fetch(ENV_CONFIG.getApiBase() + '/api/excel/compare', {
                    method: 'POST',
                    body: formData
                });

                console.log('📡 收到回應狀態:', response.status);
                console.log('📡 收到回應標頭:', response.headers);
                
                const result = await response.json();
                console.log('📡 收到回應內容:', result);
                
                if (result.success) {
                    console.log('✅ Excel 比對成功:', result.data);
                    displayCompareResult(result.data);
                } else {
                    console.error('❌ Excel 比對失敗:', result.message);
                    alert('❌ Excel 比對失敗: ' + result.message);
                }
            } catch (error) {
                console.error('❌ 上傳失敗:', error);
                alert('❌ 上傳失敗: ' + error.message);
            }
        }

        // 顯示比對結果
        function displayCompareResult(data) {
            currentCompareData = data;
            
            // 更新統計數據
            document.getElementById('totalExcelRecords').textContent = data.totalExcelRecords;
            document.getElementById('systemRecords').textContent = data.systemRecords;
            document.getElementById('newRecords').textContent = data.newRecords;
            document.getElementById('duplicateRecords').textContent = data.duplicateRecords;
            
            // 顯示比對結果
            document.getElementById('compareResult').style.display = 'block';
            
            // 啟用/禁用匯入按鈕
            const importBtn = document.getElementById('importBtn');
            const importAllBtn = document.getElementById('importAllBtn');
            
            if (data.newRecords > 0) {
                // 有新記錄時，顯示兩個按鈕
                importBtn.disabled = false;
                importBtn.textContent = `📥 匯入 ${data.newRecords} 筆新記錄`;
                importBtn.onclick = () => importAllNewRecords(data.newRecordsData);
                
                if (data.duplicateRecords > 0) {
                    // 也有重複記錄時，顯示匯入全部按鈕
                    importAllBtn.style.display = 'inline-block';
                    importAllBtn.textContent = `📥 匯入全部 ${data.newRecords + data.duplicateRecords} 筆記錄`;
                    importAllBtn.onclick = () => {
                        const allRecords = [...data.newRecordsData, ...data.duplicateRecordsData];
                        importAllRecords(allRecords);
                    };
                } else {
                    importAllBtn.style.display = 'none';
                }
            } else if (data.duplicateRecords > 0) {
                // 只有重複記錄時，只顯示匯入重複記錄按鈕
                importBtn.disabled = false;
                importBtn.textContent = `📥 匯入 ${data.duplicateRecords} 筆重複記錄`;
                importBtn.onclick = () => importAllRecords(data.duplicateRecordsData);
                importAllBtn.style.display = 'none';
            } else {
                // 沒有記錄時，禁用按鈕
                importBtn.disabled = true;
                importBtn.textContent = '📥 選擇匯入記錄';
                importAllBtn.style.display = 'none';
            }
            
            // 顯示記錄預覽
            displayRecordsPreview(data.newRecordsData, 'newRecordsPreview', 'newRecordsList');
            displayRecordsPreview(data.duplicateRecordsData, 'duplicateRecordsPreview', 'duplicateRecordsList');
        }

        // 顯示記錄預覽
        function displayRecordsPreview(records, previewId, listId) {
            const previewElement = document.getElementById(previewId);
            const listElement = document.getElementById(listId);
            
            if (records.length > 0) {
                listElement.style.display = 'block';
                
                previewElement.innerHTML = records.slice(0, 10).map(record => `
                    <div class="record-item">
                        <div class="record-info">
                            <div class="record-date">${record.date || 'N/A'}</div>
                            <div class="record-details">
                                ${record.member || 'N/A'} - ${record.description || 'N/A'} - $${record.amount || 'N/A'}
                            </div>
                        </div>
                    </div>
                `).join('');
                
                if (records.length > 10) {
                    previewElement.innerHTML += `<div class="record-item"><div class="record-info">... 還有 ${records.length - 10} 筆記錄</div></div>`;
                }
            } else {
                listElement.style.display = 'none';
            }
        }

        // 顯示匯入選擇界面
        function showImportSelection() {
            console.log('🔍 [DEBUG] showImportSelection 被調用');
            console.log('🔍 [DEBUG] currentCompareData:', currentCompareData);
            
            if (!currentCompareData || currentCompareData.newRecords === 0) {
                console.log('❌ [DEBUG] 沒有可匯入的新記錄');
                alert('❌ 沒有可匯入的新記錄');
                return;
            }

            console.log('🔍 [DEBUG] 準備顯示匯入選擇界面');
            
            // 隱藏比對結果
            const compareResult = document.getElementById('compareResult');
            if (compareResult) {
                compareResult.style.display = 'none';
                console.log('✅ [DEBUG] 已隱藏比對結果');
            } else {
                console.error('❌ [DEBUG] 找不到 compareResult 元素');
            }
            
            // 顯示匯入選擇界面
            const importSelection = document.getElementById('importSelection');
            if (importSelection) {
                importSelection.style.display = 'block';
                console.log('✅ [DEBUG] 已顯示匯入選擇界面');
            } else {
                console.error('❌ [DEBUG] 找不到 importSelection 元素');
            }
            
            // 生成記錄選擇清單
            console.log('🔍 [DEBUG] 準備生成記錄清單，記錄數:', currentCompareData.newRecordsData ? currentCompareData.newRecordsData.length : 'undefined');
            generateRecordsSelectionList(currentCompareData.newRecordsData);
        }

        // 生成記錄選擇清單
        function generateRecordsSelectionList(records) {
            console.log('🔍 [DEBUG] generateRecordsSelectionList 被調用');
            console.log('🔍 [DEBUG] records:', records);
            
            const listContainer = document.getElementById('recordsSelectionList');
            if (!listContainer) {
                console.error('❌ [DEBUG] 找不到 recordsSelectionList 元素');
                return;
            }
            
            console.log('✅ [DEBUG] 找到 recordsSelectionList 元素');
            listContainer.innerHTML = '';
            
            if (!records || !Array.isArray(records)) {
                console.error('❌ [DEBUG] records 不是有效數組:', records);
                return;
            }
            
            // 合併所有記錄（新記錄 + 重複記錄）
            const allRecords = [];
            
            // 添加新記錄
            if (currentCompareData.newRecordsData) {
                allRecords.push(...currentCompareData.newRecordsData.map(record => ({
                    ...record,
                    isNew: true
                })));
            }
            
            // 添加重複記錄
            if (currentCompareData.duplicateRecordsData) {
                allRecords.push(...currentCompareData.duplicateRecordsData.map(record => ({
                    ...record,
                    isNew: false
                })));
            }
            
            console.log('🔍 [DEBUG] 合併後總記錄數:', allRecords.length);
            
            // 按日期從新到舊排序
            allRecords.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA; // 新到舊
            });
            
            console.log('🔍 [DEBUG] 排序完成，開始生成記錄清單');
            
            allRecords.forEach((record, index) => {
                console.log(`🔍 [DEBUG] 處理記錄 ${index}:`, record);
                
                const item = document.createElement('div');
                item.className = 'record-selection-item';
                
                // 檢查是否有重複資料
                const duplicateInfo = checkForDuplicateRecord(record);
                const duplicateNote = duplicateInfo ? 
                    `<div class="duplicate-note">⚠️ 可能與系統中現有記錄重複</div>` : '';
                
                // 添加記錄類型標記
                const recordTypeNote = record.isNew ? 
                    `<div class="record-type-note new">🆕 新記錄</div>` : 
                    `<div class="record-type-note duplicate">🔄 重複記錄</div>`;
                
                item.innerHTML = `
                    <input type="checkbox" id="record_${index}" value="${index}" onchange="updateSelectedCount()" checked>
                    <div class="record-info">
                        <span class="label">成員:</span>
                        <span class="value">${record.member}</span>
                        <span class="label">日期:</span>
                        <span class="value">${record.date}</span>
                        <span class="label">金額:</span>
                        <span class="value">$${record.amount}</span>
                        <span class="label">類別:</span>
                        <span class="value">${record.mainCategory}</span>
                        <span class="label">描述:</span>
                        <span class="value">${record.description}</span>
                    </div>
                    ${recordTypeNote}
                    ${duplicateNote}
                `;
                listContainer.appendChild(item);
                console.log(`✅ [DEBUG] 已添加記錄 ${index} 到清單`);
            });
            
            console.log('✅ [DEBUG] 所有記錄已添加到清單，開始初始化選擇計數');
            // 初始化選擇計數
            updateSelectedCount();
        }

        // 檢查記錄是否可能重複
        function checkForDuplicateRecord(excelRecord) {
            // 使用簡化的比對邏輯檢查是否有相似的記錄
            return records.some(systemRecord => {
                if (!systemRecord) return false;
                
                // 比較核心欄位
                const memberMatch = systemRecord.member === excelRecord.member;
                // 正規化日期格式進行比較
                const dateMatch = convertDateToStandard(systemRecord.date) === convertDateToStandard(excelRecord.date);
                const amountMatch = Math.abs(systemRecord.amount) === Math.abs(excelRecord.amount);
                
                // 如果成員、日期、金額都匹配，可能是重複記錄
                return memberMatch && dateMatch && amountMatch;
            });
        }

        // 更新選擇計數
        function updateSelectedCount() {
            const checkboxes = document.querySelectorAll('#recordsSelectionList input[type="checkbox"]');
            const checkedBoxes = document.querySelectorAll('#recordsSelectionList input[type="checkbox"]:checked');
            const count = checkedBoxes.length;
            
            document.getElementById('selectedCount').textContent = `已選擇 ${count} 筆記錄`;
            document.getElementById('confirmImportBtn').disabled = count === 0;
        }

        // 全選記錄
        function selectAllRecords() {
            const checkboxes = document.querySelectorAll('#recordsSelectionList input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
            updateSelectedCount();
        }

        // 全不選記錄
        function deselectAllRecords() {
            const checkboxes = document.querySelectorAll('#recordsSelectionList input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            updateSelectedCount();
        }

        // 只選新記錄
        function selectNewRecordsOnly() {
            const checkboxes = document.querySelectorAll('#recordsSelectionList input[type="checkbox"]');
            checkboxes.forEach((checkbox, index) => {
                // 找到對應的記錄類型標記
                const recordItem = checkbox.closest('.record-selection-item');
                const typeNote = recordItem.querySelector('.record-type-note.new');
                checkbox.checked = typeNote !== null; // 只有新記錄才選中
            });
            updateSelectedCount();
        }

        // 匯入所有記錄（包括重複記錄）
        async function importAllRecords(allRecordsData) {
            console.log('📥 開始匯入所有記錄:', allRecordsData.length, '筆');
            
            try {
                let successCount = 0;
                let errorCount = 0;
                const errors = [];
                
                // 逐筆添加到JSON文件
                for (const record of allRecordsData) {
                    try {
                        // 為每筆記錄生成新的唯一ID，避免重複
                        const newRecord = {
                            ...record,
                            id: generateUniqueId()
                        };
                        
                        const addResponse = await fetch(ENV_CONFIG.getApiBase() + '/api/records', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(newRecord)
                        });
                        
                        const addResult = await addResponse.json();
                        
                        if (addResult.success) {
                            successCount++;
                            console.log('✅ 記錄已添加:', newRecord.id);
                        } else {
                            errorCount++;
                            errors.push(`記錄 ${newRecord.id}: ${addResult.message}`);
                            console.error('❌ 記錄添加失敗:', newRecord.id, addResult.message);
                        }
                    } catch (recordError) {
                        errorCount++;
                        errors.push(`記錄 ${record.id}: ${recordError.message}`);
                        console.error('❌ 記錄添加錯誤:', record.id, recordError.message);
                    }
                }
                
                if (successCount > 0) {
                    console.log(`✅ 成功匯入 ${successCount} 筆記錄到JSON文件`);
                    
                    // 重新載入資料
                    await loadDataFromFile();
                    
                    // 更新所有顯示
                    updateAllDisplays();
                    
                    // 清除比對結果
                    clearCompareResult();
                    
                    if (errorCount > 0) {
                        // 顯示詳細的匯入結果
                        const resultMessage = `📊 匯入結果統計：\n📄 Excel總筆數：${allRecordsData.length} 筆記錄\n✅ 成功匯入：${successCount} 筆記錄\n❌ 匯入失敗：${errorCount} 筆記錄\n\n📋 失敗記錄詳情：\n${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}`;
                        alert(resultMessage);
                    } else {
                        alert(`✅ 匯入完成！\n\n📊 統計結果：\n📄 Excel總筆數：${allRecordsData.length} 筆記錄\n✅ 成功匯入：${successCount} 筆記錄\n❌ 匯入失敗：0 筆記錄`);
                    }
                } else {
                    console.error('❌ 所有記錄匯入失敗');
                    const failMessage = `❌ 匯入失敗！\n\n📊 統計結果：\n📄 Excel總筆數：${allRecordsData.length} 筆記錄\n✅ 成功匯入：0 筆記錄\n❌ 匯入失敗：${errorCount} 筆記錄\n\n📋 失敗記錄詳情：\n${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}`;
                    alert(failMessage);
                }
            } catch (error) {
                console.error('❌ 匯入過程發生錯誤:', error);
                alert(`❌ 匯入過程發生錯誤：${error.message}\n\n📊 統計結果：\n📄 Excel總筆數：${allRecordsData.length} 筆記錄\n✅ 成功匯入：0 筆記錄\n❌ 匯入失敗：${allRecordsData.length} 筆記錄`);
            }
        }

        // 直接匯入所有新記錄
        async function importAllNewRecords(newRecordsData) {
            console.log('📥 開始直接匯入所有新記錄:', newRecordsData.length, '筆');
            
            try {
                let successCount = 0;
                let errorCount = 0;
                const errors = [];
                
                // 逐筆添加到JSON文件
                for (const record of newRecordsData) {
                    try {
                        console.log('📤 準備添加記錄:', record);
                        
                        const addResponse = await fetch(ENV_CONFIG.getApiBase() + '/api/records', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(record)
                        });
                        
                        console.log('📡 API回應狀態:', addResponse.status);
                        console.log('📡 API回應標頭:', addResponse.headers);
                        
                        const addResult = await addResponse.json();
                        console.log('📡 API回應內容:', addResult);
                        
                        if (addResult.success) {
                            successCount++;
                            console.log('✅ 記錄已添加:', record.id);
                        } else {
                            errorCount++;
                            errors.push(`記錄 ${record.id}: ${addResult.message}`);
                            console.error('❌ 記錄添加失敗:', record.id, addResult.message);
                        }
                    } catch (recordError) {
                        errorCount++;
                        errors.push(`記錄 ${record.id}: ${recordError.message}`);
                        console.error('❌ 記錄添加錯誤:', record.id, recordError.message);
                        console.error('❌ 錯誤堆疊:', recordError.stack);
                    }
                }
                
                if (successCount > 0) {
                    console.log(`✅ 成功匯入 ${successCount} 筆記錄到JSON文件`);
                    
                    // 重新載入資料
                    await loadDataFromFile();
                    
                    // 更新所有顯示
                    updateAllDisplays();
                    
                    // 清除比對結果
                    clearCompareResult();
                    
                    if (errorCount > 0) {
                        // 顯示詳細的匯入結果
                        const resultMessage = `📊 匯入結果統計：\n📄 Excel總筆數：${newRecordsData.length} 筆記錄\n✅ 成功匯入：${successCount} 筆記錄\n❌ 匯入失敗：${errorCount} 筆記錄\n\n📋 失敗記錄詳情：\n${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}`;
                        alert(resultMessage);
                    } else {
                        alert(`✅ 匯入完成！\n\n📊 統計結果：\n📄 Excel總筆數：${newRecordsData.length} 筆記錄\n✅ 成功匯入：${successCount} 筆記錄\n❌ 匯入失敗：0 筆記錄`);
                    }
                } else {
                    console.error('❌ 所有記錄匯入失敗');
                    const failMessage = `❌ 匯入失敗！\n\n📊 統計結果：\n📄 Excel總筆數：${newRecordsData.length} 筆記錄\n✅ 成功匯入：0 筆記錄\n❌ 匯入失敗：${errorCount} 筆記錄\n\n📋 失敗記錄詳情：\n${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}`;
                    alert(failMessage);
                }
            } catch (error) {
                console.error('❌ 匯入過程發生錯誤:', error);
                alert(`❌ 匯入過程發生錯誤：${error.message}\n\n📊 統計結果：\n📄 Excel總筆數：${newRecordsData.length} 筆記錄\n✅ 成功匯入：0 筆記錄\n❌ 匯入失敗：${newRecordsData.length} 筆記錄`);
            }
        }

        // 確認匯入選中的記錄
        async function confirmSelectedImport() {
            const checkedBoxes = document.querySelectorAll('#recordsSelectionList input[type="checkbox"]:checked');
            
            if (checkedBoxes.length === 0) {
                alert('❌ 請至少選擇一筆記錄');
                return;
            }

            if (!confirm(`確定要匯入選中的 ${checkedBoxes.length} 筆記錄嗎？`)) {
                return;
            }

            // 收集選中的記錄
            const selectedRecords = [];
            checkedBoxes.forEach(checkbox => {
                const index = parseInt(checkbox.value);
                selectedRecords.push(currentCompareData.newRecordsData[index]);
            });

            try {
                console.log('📥 開始向JSON文件匯入選中的記錄...');
                
                let successCount = 0;
                let errorCount = 0;
                const errors = [];
                
                // 逐筆添加到JSON文件
                for (const record of selectedRecords) {
                    try {
                        const addResponse = await fetch(ENV_CONFIG.getApiBase() + '/api/records', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(record)
                        });
                        
                        const addResult = await addResponse.json();
                        
                        if (addResult.success) {
                            successCount++;
                            console.log('✅ 記錄已添加:', record.id);
                        } else {
                            errorCount++;
                            errors.push(`記錄 ${record.id}: ${addResult.message}`);
                            console.error('❌ 記錄添加失敗:', record.id, addResult.message);
                        }
                    } catch (recordError) {
                        errorCount++;
                        errors.push(`記錄 ${record.id}: ${recordError.message}`);
                        console.error('❌ 記錄添加錯誤:', record.id, recordError.message);
                    }
                }
                
                if (successCount > 0) {
                    console.log(`✅ 成功匯入 ${successCount} 筆記錄到JSON文件`);
                    
                    // 重新載入資料
                    await loadDataFromFile();
                    
                    // 更新所有顯示
                    updateAllDisplays();
                    
                    // 自動提交到Git（不更新版本號） - 已移除
                    
                    // 清除所有結果
                    clearCompareResult();
                    hideImportSelection();
                    
                    if (errorCount > 0) {
                        // 顯示詳細的匯入結果
                        const resultMessage = `📊 匯入結果統計：\n📄 Excel總筆數：${allRecordsData.length} 筆記錄\n✅ 成功匯入：${successCount} 筆記錄\n❌ 匯入失敗：${errorCount} 筆記錄\n\n📋 失敗記錄詳情：\n${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}`;
                        alert(resultMessage);
                    } else {
                        alert(`✅ 匯入完成！\n\n📊 統計結果：\n📄 Excel總筆數：${allRecordsData.length} 筆記錄\n✅ 成功匯入：${successCount} 筆記錄\n❌ 匯入失敗：0 筆記錄`);
                    }
                } else {
                    console.error('❌ 所有記錄匯入失敗');
                    const failMessage = `❌ 匯入失敗！\n\n📊 統計結果：\n📄 Excel總筆數：${allRecordsData.length} 筆記錄\n✅ 成功匯入：0 筆記錄\n❌ 匯入失敗：${errorCount} 筆記錄\n\n📋 失敗記錄詳情：\n${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}`;
                    alert(failMessage);
                }
            } catch (error) {
                console.error('❌ 匯入過程發生錯誤:', error);
                alert(`❌ 匯入過程發生錯誤：${error.message}\n\n📊 統計結果：\n📄 Excel總筆數：${allRecordsData.length} 筆記錄\n✅ 成功匯入：0 筆記錄\n❌ 匯入失敗：${allRecordsData.length} 筆記錄`);
            }
        }

        // 隱藏匯入選擇界面
        function hideImportSelection() {
            document.getElementById('importSelection').style.display = 'none';
            document.getElementById('compareResult').style.display = 'block';
        }

        // 取消匯入選擇
        function cancelImportSelection() {
            hideImportSelection();
        }

        // 清除選擇
        function clearSelection() {
            const checkboxes = document.querySelectorAll('#recordsSelectionList input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            updateSelectedCount();
        }

        // 自動提交到Git（包含版本號更新） - 已移除

        // 提交到Git（不更新版本號） - 已移除

        // 更新版本號
        async function updateVersionNumber() {
            try {
                console.log('🔄 開始更新版本號...');
                
                // 調用後端API更新版本號
                const response = await fetch(ENV_CONFIG.getApiBase() + '/api/version/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        commitHash: 'auto-update',
                        description: "Excel匯入後自動更新版本號"
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    console.log('✅ 版本號更新成功:', result.data.version);
                    
                    // 更新前端顯示的版本號
                    updateVersionDisplay(result.data.version);
                    
                    return result.data.version;
                } else {
                    console.error('❌ 版本號更新失敗:', result.message);
                    throw new Error(result.message);
                }
                
            } catch (error) {
                console.error('❌ 版本號更新失敗:', error);
                throw error;
            }
        }

        // 更新版本號顯示
        function updateVersionDisplay(versionString) {
            const versionElements = document.querySelectorAll('.version-info');
            versionElements.forEach(element => {
                if (element.textContent.includes('版本')) {
                    element.textContent = element.textContent.replace(/版本: [^\s]+/, `版本: ${versionString}`);
                }
            });
        }

        // 顯示通知
        function showNotification(message, type = 'info') {
            // 創建通知元素
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            
            // 添加樣式
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 6px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                max-width: 400px;
                word-wrap: break-word;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease-out;
            `;
            
            // 根據類型設置顏色
            switch(type) {
                case 'success':
                    notification.style.backgroundColor = '#28a745';
                    break;
                case 'warning':
                    notification.style.backgroundColor = '#ffc107';
                    notification.style.color = '#000';
                    break;
                case 'error':
                    notification.style.backgroundColor = '#dc3545';
                    break;
                default:
                    notification.style.backgroundColor = '#007bff';
            }
            
            // 添加到頁面
            document.body.appendChild(notification);
            
            // 3秒後自動移除
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }

        // 清除比對結果
        function clearCompareResult() {
            document.getElementById('compareResult').style.display = 'none';
            document.getElementById('importSelection').style.display = 'none';
            document.getElementById('excelFileInput').value = '';
            currentCompareData = null;
        }

        // ==================== 新的 Excel 匯入功能已整合到數據匯入區塊 ====================
        
        // 初始化新的 Excel 匯入功能
        function initExcelImportUpload() {
            const fileInput = document.getElementById('excelImportFileInput');
            const uploadArea = document.getElementById('excelImportUploadArea');

            // 檔案選擇事件
            fileInput.addEventListener('change', function(e) {
                if (e.target.files.length > 0) {
                    handleExcelImportUpload(e.target.files[0]);
                }
            });

            // 拖拽功能
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleExcelImportUpload(files[0]);
                }
            });

            // 點擊上傳區域
            uploadArea.addEventListener('click', function() {
                fileInput.click();
            });
        }

        // 處理新的 Excel 匯入檔案上傳
        async function handleExcelImportUpload(file) {
            console.log('📁 開始處理 Excel 匯入檔案上傳:', file.name);
            console.log('📁 檔案大小:', file.size, 'bytes');
            console.log('📁 檔案類型:', file.type);
            console.log('📁 API 地址:', ENV_CONFIG.getApiBase() + '/api/excel/compare');
            
            // 驗證檔案類型
            if (!file.name.match(/\.(xlsx|xls)$/i)) {
                alert('❌ 請選擇 Excel 檔案 (.xlsx 或 .xls)');
                return;
            }

            // 驗證檔案大小
            if (file.size > 10 * 1024 * 1024) {
                alert('❌ 檔案大小不能超過 10MB');
                return;
            }

            const formData = new FormData();
            formData.append('excelFile', file);

            try {
                console.log('📡 開始發送請求到:', ENV_CONFIG.getApiBase() + '/api/excel/compare');
                console.log('📡 FormData 內容:', formData);
                
                const response = await fetch(ENV_CONFIG.getApiBase() + '/api/excel/compare', {
                    method: 'POST',
                    body: formData
                });

                console.log('📡 收到回應狀態:', response.status);
                console.log('📡 收到回應標頭:', response.headers);
                
                const result = await response.json();
                console.log('📡 收到回應內容:', result);
                
                if (result.success) {
                    console.log('✅ Excel 比對成功:', result.data);
                    displayExcelImportCompareResult(result.data);
                } else {
                    console.error('❌ Excel 比對失敗:', result.message);
                    alert('❌ Excel 比對失敗: ' + result.message);
                }
            } catch (error) {
                console.error('❌ 上傳失敗:', error);
                alert('❌ 上傳失敗: ' + error.message);
            }
        }

        // 顯示新的 Excel 匯入比對結果
        function displayExcelImportCompareResult(data) {
            currentExcelImportData = data;
            
            // 更新統計數據
            document.getElementById('excelImportTotalRecords').textContent = data.totalExcelRecords;
            document.getElementById('excelImportSystemRecords').textContent = data.systemRecords;
            document.getElementById('excelImportNewRecords').textContent = data.newRecords;
            document.getElementById('excelImportDuplicateRecords').textContent = data.duplicateRecords;
            
            // 顯示比對結果
            document.getElementById('excelImportCompareResult').style.display = 'block';
            
            // 啟用/禁用匯入按鈕
            const importBtn = document.getElementById('excelImportBtn');
            if (data.newRecords > 0) {
                importBtn.disabled = false;
                importBtn.textContent = `📥 選擇匯入 ${data.newRecords} 筆記錄`;
            } else {
                importBtn.disabled = true;
                importBtn.textContent = '📥 選擇匯入記錄';
            }
            
            // 顯示新記錄預覽
            if (data.newRecordsData && data.newRecordsData.length > 0) {
                const preview = document.getElementById('excelImportNewRecordsPreview');
                preview.innerHTML = data.newRecordsData.slice(0, 5).map(record => 
                    `<div class="record-preview-item">
                        <span class="record-date">${record.date}</span>
                        <span class="record-member">${record.member}</span>
                        <span class="record-description">${record.description || record.mainCategory}</span>
                        <span class="record-amount">$${record.amount}</span>
                    </div>`
                ).join('');
                document.getElementById('excelImportNewRecordsList').style.display = 'block';
            }
            
            // 顯示重複記錄預覽
            if (data.duplicateRecordsData && data.duplicateRecordsData.length > 0) {
                const preview = document.getElementById('excelImportDuplicateRecordsPreview');
                preview.innerHTML = data.duplicateRecordsData.slice(0, 5).map(record => 
                    `<div class="record-preview-item">
                        <span class="record-date">${record.date}</span>
                        <span class="record-member">${record.member}</span>
                        <span class="record-description">${record.description || record.mainCategory}</span>
                        <span class="record-amount">$${record.amount}</span>
                    </div>`
                ).join('');
                document.getElementById('excelImportDuplicateRecordsList').style.display = 'block';
            }
        }

        // 顯示新的 Excel 匯入選擇界面
        function showExcelImportSelection() {
            console.log('🔍 [DEBUG] showExcelImportSelection 被調用');
            console.log('🔍 [DEBUG] currentExcelImportData:', currentExcelImportData);
            
            if (!currentExcelImportData || currentExcelImportData.newRecords === 0) {
                console.log('❌ [DEBUG] 沒有可匯入的新記錄');
                alert('❌ 沒有可匯入的新記錄');
                return;
            }

            console.log('🔍 [DEBUG] 準備顯示匯入選擇界面');
            
            // 隱藏比對結果
            const compareResult = document.getElementById('excelImportCompareResult');
            if (compareResult) {
                compareResult.style.display = 'none';
                console.log('✅ [DEBUG] 已隱藏比對結果');
            } else {
                console.error('❌ [DEBUG] 找不到 excelImportCompareResult 元素');
            }
            
            // 顯示匯入選擇界面
            const importSelection = document.getElementById('excelImportSelection');
            if (importSelection) {
                importSelection.style.display = 'block';
                console.log('✅ [DEBUG] 已顯示匯入選擇界面');
            } else {
                console.error('❌ [DEBUG] 找不到 excelImportSelection 元素');
            }
            
            // 生成記錄選擇清單
            console.log('🔍 [DEBUG] 準備生成記錄清單，記錄數:', currentExcelImportData.newRecordsData ? currentExcelImportData.newRecordsData.length : 'undefined');
            generateExcelImportRecordsSelectionList(currentExcelImportData.newRecordsData);
        }

        // 生成新的 Excel 匯入記錄選擇清單
        function generateExcelImportRecordsSelectionList(records) {
            console.log('🔍 [DEBUG] generateExcelImportRecordsSelectionList 被調用');
            console.log('🔍 [DEBUG] records:', records);
            
            const listContainer = document.getElementById('excelImportRecordsSelection');
            if (!listContainer) {
                console.error('❌ [DEBUG] 找不到 excelImportRecordsSelection 元素');
                return;
            }
            
            console.log('✅ [DEBUG] 找到 excelImportRecordsSelection 元素');
            listContainer.innerHTML = '';
            
            if (!records || !Array.isArray(records)) {
                console.error('❌ [DEBUG] records 不是有效數組:', records);
                return;
            }
            
            // 合併所有記錄（新記錄 + 重複記錄）
            const allRecords = [];
            
            // 添加新記錄
            if (currentExcelImportData.newRecordsData) {
                allRecords.push(...currentExcelImportData.newRecordsData.map(record => ({
                    ...record,
                    isNew: true
                })));
            }
            
            // 添加重複記錄
            if (currentExcelImportData.duplicateRecordsData) {
                allRecords.push(...currentExcelImportData.duplicateRecordsData.map(record => ({
                    ...record,
                    isNew: false
                })));
            }
            
            console.log('🔍 [DEBUG] 合併後總記錄數:', allRecords.length);
            
            // 按日期從新到舊排序
            allRecords.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA; // 新到舊
            });
            
            console.log('🔍 [DEBUG] 排序完成，開始生成記錄清單');
            
            allRecords.forEach((record, index) => {
                console.log(`🔍 [DEBUG] 處理記錄 ${index}:`, record);
                
                const item = document.createElement('div');
                item.className = 'record-selection-item';
                
                // 檢查是否有重複資料
                const duplicateInfo = checkForDuplicateRecord(record);
                const duplicateNote = duplicateInfo ? 
                    `<div class="duplicate-note">⚠️ 可能與系統中現有記錄重複</div>` : '';
                
                // 添加記錄類型標記
                const recordTypeNote = record.isNew ? 
                    `<div class="record-type-note new">🆕 新記錄</div>` : 
                    `<div class="record-type-note duplicate">🔄 重複記錄</div>`;
                
                item.innerHTML = `
                    <div class="record-selection-content">
                        <input type="checkbox" value="${index}" onchange="updateExcelImportSelectedCount()">
                        <div class="record-info">
                            <div class="record-header">
                                ${recordTypeNote}
                                <span class="record-date">${record.date}</span>
                                <span class="record-member">${record.member}</span>
                                <span class="record-amount ${record.type}">$${record.amount}</span>
                            </div>
                            <div class="record-details">
                                <span class="record-category">${record.mainCategory}</span>
                                <span class="record-subcategory">${record.subCategory || '未設定'}</span>
                                ${record.description ? `<span class="record-description">${record.description}</span>` : ''}
                            </div>
                            ${duplicateNote}
                        </div>
                    </div>
                `;
                
                listContainer.appendChild(item);
                console.log(`✅ [DEBUG] 已添加記錄 ${index} 到清單`);
            });
            
            console.log('✅ [DEBUG] 所有記錄已添加到清單，開始初始化選擇計數');
            // 初始化選擇計數
            updateExcelImportSelectedCount();
        }

        // 更新新的 Excel 匯入選擇計數
        function updateExcelImportSelectedCount() {
            const checkboxes = document.querySelectorAll('#excelImportRecordsSelection input[type="checkbox"]');
            const checkedBoxes = document.querySelectorAll('#excelImportRecordsSelection input[type="checkbox"]:checked');
            const count = checkedBoxes.length;
            
            // 更新確認按鈕狀態
            const confirmBtn = document.querySelector('#excelImportSelection .btn-success');
            if (confirmBtn) {
                confirmBtn.disabled = count === 0;
                confirmBtn.textContent = count === 0 ? '確認匯入選中記錄' : `確認匯入選中記錄 (${count})`;
            }
        }

        // 全選新的 Excel 匯入記錄
        function selectAllExcelImportRecords() {
            const checkboxes = document.querySelectorAll('#excelImportRecordsSelection input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
            updateExcelImportSelectedCount();
        }

        // 只選新的 Excel 匯入記錄
        function selectNewExcelImportRecordsOnly() {
            const checkboxes = document.querySelectorAll('#excelImportRecordsSelection input[type="checkbox"]');
            checkboxes.forEach((checkbox, index) => {
                // 找到對應的記錄類型標記
                const recordItem = checkbox.closest('.record-selection-item');
                const typeNote = recordItem.querySelector('.record-type-note.new');
                checkbox.checked = typeNote !== null;
            });
            updateExcelImportSelectedCount();
        }

        // 清除新的 Excel 匯入選擇
        function clearExcelImportSelection() {
            const checkboxes = document.querySelectorAll('#excelImportRecordsSelection input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            updateExcelImportSelectedCount();
        }

        // 確認新的 Excel 匯入選中的記錄
        async function confirmExcelImportSelected() {
            const checkedBoxes = document.querySelectorAll('#excelImportRecordsSelection input[type="checkbox"]:checked');
            
            if (checkedBoxes.length === 0) {
                alert('❌ 請至少選擇一筆記錄');
                return;
            }

            if (!confirm(`確定要匯入選中的 ${checkedBoxes.length} 筆記錄嗎？`)) {
                return;
            }

            // 收集選中的記錄
            const selectedRecords = [];
            checkedBoxes.forEach(checkbox => {
                const index = parseInt(checkbox.value);
                const allRecords = [
                    ...(currentExcelImportData.newRecordsData || []),
                    ...(currentExcelImportData.duplicateRecordsData || [])
                ];
                selectedRecords.push(allRecords[index]);
            });

            try {
                console.log('📥 開始向JSON文件匯入選中的記錄...');
                
                let successCount = 0;
                let errorCount = 0;
                const errors = [];
                
                // 逐筆添加到JSON文件
                for (const record of selectedRecords) {
                    try {
                        const addResponse = await fetch(ENV_CONFIG.getApiBase() + '/api/records', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(record)
                        });
                        
                        const addResult = await addResponse.json();
                        
                        if (addResult.success) {
                            successCount++;
                            console.log('✅ 記錄已添加:', record.id);
                        } else {
                            errorCount++;
                            errors.push(`記錄 ${record.id}: ${addResult.message}`);
                            console.error('❌ 記錄添加失敗:', record.id, addResult.message);
                        }
                    } catch (recordError) {
                        errorCount++;
                        errors.push(`記錄 ${record.id}: ${recordError.message}`);
                        console.error('❌ 記錄添加錯誤:', record.id, recordError.message);
                    }
                }
                
                if (successCount > 0) {
                    console.log(`✅ 成功匯入 ${successCount} 筆記錄到JSON文件`);
                    
                    // 重新載入資料
                    await loadDataFromFile();
                    
                    // 更新所有顯示
                    updateAllDisplays();
                    
                    // 自動提交到Git（不更新版本號） - 已移除
                    
                    // 清除所有結果
                    clearExcelImportResult();
                    hideExcelImportSelection();
                    
                    if (errorCount > 0) {
                        // 顯示詳細的匯入結果
                        const resultMessage = `📊 匯入結果統計：\n📄 Excel總筆數：${allRecordsData.length} 筆記錄\n✅ 成功匯入：${successCount} 筆記錄\n❌ 匯入失敗：${errorCount} 筆記錄\n\n📋 失敗記錄詳情：\n${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}`;
                        alert(resultMessage);
                    } else {
                        alert(`✅ 匯入完成！\n\n📊 統計結果：\n📄 Excel總筆數：${allRecordsData.length} 筆記錄\n✅ 成功匯入：${successCount} 筆記錄\n❌ 匯入失敗：0 筆記錄`);
                    }
                } else {
                    console.error('❌ 所有記錄匯入失敗');
                    const failMessage = `❌ 匯入失敗！\n\n📊 統計結果：\n📄 Excel總筆數：${allRecordsData.length} 筆記錄\n✅ 成功匯入：0 筆記錄\n❌ 匯入失敗：${errorCount} 筆記錄\n\n📋 失敗記錄詳情：\n${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}`;
                    alert(failMessage);
                }
            } catch (error) {
                console.error('❌ 匯入過程發生錯誤:', error);
                alert(`❌ 匯入過程發生錯誤：${error.message}\n\n📊 統計結果：\n📄 Excel總筆數：${allRecordsData.length} 筆記錄\n✅ 成功匯入：0 筆記錄\n❌ 匯入失敗：${allRecordsData.length} 筆記錄`);
            }
        }

        // 隱藏新的 Excel 匯入選擇界面
        function hideExcelImportSelection() {
            document.getElementById('excelImportSelection').style.display = 'none';
            document.getElementById('excelImportCompareResult').style.display = 'block';
        }

        // 取消新的 Excel 匯入選擇
        function cancelExcelImportSelection() {
            hideExcelImportSelection();
        }

        // 清除新的 Excel 匯入結果
        function clearExcelImportResult() {
            document.getElementById('excelImportCompareResult').style.display = 'none';
            document.getElementById('excelImportSelection').style.display = 'none';
            document.getElementById('excelImportFileInput').value = '';
            currentExcelImportData = null;
        }

        // 初始化
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 DOM已載入，開始初始化...');
            
            // 載入版本信息
            loadVersionInfo();
            
            // 初始化 Excel 上傳功能
            initExcelUpload();
            
            // 初始化新的 Excel 匯入功能已移除 - 已整合到數據匯入區塊
            
            // 防止過度滾動
            preventOverScroll();
            
            // 檢測並修復Safari
            const isSafari = detectAndFixSafari();
            console.log('🌐 瀏覽器檢測:', isSafari ? 'Safari' : '其他');
            
            initializeApp();
            initializeSwipeIndicators();
        });

        // 頁面可見性變化時同步數據（減少頻率）
        let lastSyncTime = 0;
        const SYNC_COOLDOWN = 5000; // 5秒冷卻時間
        
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                const now = Date.now();
                if (now - lastSyncTime > SYNC_COOLDOWN) {
                    console.log('👁️ 頁面重新可見，同步數據...');
                    lastSyncTime = now;
                    // 同步功能已移除，直接重新載入數據
                    loadDataFromFile().then(() => {
                        updateAllDisplays();
                        console.log('✅ 頁面可見性數據重新載入完成');
                    });
                } else {
                    console.log('⏰ 同步冷卻中，跳過本次同步');
                }
            }
        });

        // 頁面獲得焦點時同步數據（使用相同的冷卻機制）
        window.addEventListener('focus', function() {
            const now = Date.now();
            if (now - lastSyncTime > SYNC_COOLDOWN) {
                console.log('🎯 頁面獲得焦點，檢查數據更新');
                lastSyncTime = now;
                // 同步功能已移除，直接重新載入數據
                loadDataFromFile().then(() => {
                    updateAllDisplays();
                    console.log('✅ 焦點數據重新載入完成');
                });
            } else {
                console.log('⏰ 焦點同步冷卻中，跳過本次同步');
            }
        });

        async function initializeApp() {
            console.log('開始初始化應用程式...');
            
            // 總是從服務器讀取最新數據
            console.log('🔄 從服務器讀取最新數據...');
            await loadDataFromFile();
            
            // Token管理功能已移除 - 備份功能已移除
            console.log('🔑 Token管理功能已移除，跳過檢查...');
            
            // 確保records變量已更新
            console.log('🔄 初始化完成，當前記錄數量:', records.length);
            console.log('🔄 記錄內容:', records);
            
            // GitHub更新檢查已移除（備份功能已移除）
            console.log('📊 備份功能已移除，使用JSON文件存儲');
            
            // 自動同步功能已移除 - 現在使用JSON文件存儲，不需要同步
            
            // 更新所有UI顯示
            console.log('🔄 開始更新所有UI顯示...');
            updateAllDisplays();
            
            // Token管理功能已移除 - 備份功能已移除
            console.log('🔑 Token管理功能已移除，跳過最終檢查...');
            updateSyncStatus(); // 更新同步狀態顯示
            
            // 如果沒有記錄，不自動添加示例數據
            // if (records.length === 0) {
            //     addSampleData();
            // }
            
            // 檢查是否需要切換到2025年
            checkAndSwitchTo2025();
            
            console.log('應用程式初始化完成');
        }

        // 數據載入狀態管理
        let isLoadingData = false;
        
        // 從JSON文件載入資料
        async function loadDataFromFile() {
            // 防止重複載入
            if (isLoadingData) {
                console.log('⏰ 數據正在載入中，跳過重複請求');
                return;
            }
            
            isLoadingData = true;
            try {
                console.log('🔄 開始從JSON文件載入資料...');
                console.log('🌍 當前環境:', ENV_CONFIG.getEnvironment());
                console.log('🔗 API基礎URL:', ENV_CONFIG.getApiBase());
                console.log('🔗 完整API URL:', ENV_CONFIG.getApiBase() + '/api/records');
                
                // 使用JSON文件API端點，添加無緩存標頭確保獲取最新數據
                const response = await fetch(ENV_CONFIG.getApiBase() + '/api/records', {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                
                console.log('📡 API響應狀態:', response.status);
                console.log('📡 API響應OK:', response.ok);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('📡 API響應內容:', result);
                    
                    if (result.success && Array.isArray(result.records)) {
                        records = result.records;
                        console.log('✅ 從JSON文件載入了', records.length, '筆記錄');
                        console.log('🔄 全局records變量已更新為:', records.length, '筆記錄');
                        console.log('📊 前3筆記錄:', records.slice(0, 3));
                        return;
                    } else {
                        console.warn('⚠️ JSON文件API返回無效數據:', result);
                    }
                } else {
                    console.warn('⚠️ JSON文件API請求失敗，狀態碼:', response.status);
                    const errorText = await response.text();
                    console.warn('⚠️ 錯誤內容:', errorText);
                }
                
                // JSON文件API失敗，設為空數組
                records = [];
                console.log('📝 JSON文件API失敗，records設為空數組');
                
            } catch (error) {
                console.error('❌ 從JSON文件載入失敗:', error);
                records = [];
                console.log('📝 JSON文件載入失敗，records設為空數組');
            } finally {
                isLoadingData = false; // 重置載入狀態
                console.log('✅ 數據載入狀態已重置');
            }
        }

        // 添加示例數據
        function addSampleData() {
            const today = new Date();
            const sampleRecords = [
                {
                    id: 'sample-1',
                    member: 'Kelvin',
                    type: 'expense',
                    amount: 1200,
                    mainCategory: '日常',
                    subCategory: '手機費',
                    description: '手機費',
                    date: today.toISOString().split('T')[0]
                },
                {
                    id: 'sample-2',
                    member: 'Phuong',
                    type: 'expense',
                    amount: 1598,
                    mainCategory: '日常',
                    subCategory: '網路費',
                    description: '網路費',
                    date: today.toISOString().split('T')[0]
                },
                {
                    id: 'sample-3',
                    member: '家用',
                    type: 'income',
                    amount: 50000,
                    mainCategory: '薪資',
                    subCategory: '',
                    description: 'Kelvin 薪資',
                    date: today.toISOString().split('T')[0]
                },
                {
                    id: 'sample-4',
                    member: '家用',
                    type: 'expense',
                    amount: 15000,
                    mainCategory: '居住',
                    subCategory: '房租',
                    description: '房租',
                    date: today.toISOString().split('T')[0]
                }
            ];
            
            records = records.concat(sampleRecords);
            // saveRecords() 已移除 - 數據直接保存到JSON文件
            updateStats();
            updateRecentRecords();
            updateAllRecords();
            updateCalendar();
            // updateDataStats(); // 已移除，避免覆蓋月份篩選統計
        }

        // 統一的日期格式化函數，避免時區問題
        function formatDateToYYYYMMDD(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        function setTodayDate() {
            const today = formatDateToYYYYMMDD(new Date());
            document.getElementById('date').value = today;
        }

        function updateCategoryOptions() {
            const amountInput = document.getElementById('amount');
            const mainCategorySelect = document.getElementById('mainCategory');
            const editTypeSelect = document.getElementById('editType');
            const editMainCategorySelect = document.getElementById('editMainCategory');

            function updateMainCategories(amountInput, mainCategorySelect) {
                const amount = parseFloat(amountInput.value) || 0;
                // 如果金額為0或空，默認顯示支出類別（因為大部分記錄都是支出）
                const type = (amount === 0 || isNaN(amount)) ? 'expense' : (amount >= 0 ? 'income' : 'expense');
                mainCategorySelect.innerHTML = '<option value="">請選擇</option>';
                
                console.log('updateMainCategories called:', { amount, type, inputValue: amountInput.value });
                
                if (type === 'income') {
                    categories.income.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category;
                        option.textContent = category;
                        mainCategorySelect.appendChild(option);
                    });
                } else if (type === 'expense') {
                    // 獲取所有支出類別（排除"其他"）
                    const expenseCategories = Object.keys(categories.expense).filter(cat => cat !== '其他');
                    expenseCategories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category;
                        option.textContent = category;
                        mainCategorySelect.appendChild(option);
                    });
                    // 添加"其他"選項
                    const otherOption = document.createElement('option');
                    otherOption.value = '其他';
                    otherOption.textContent = '其他';
                    mainCategorySelect.appendChild(otherOption);
                }
                
                console.log('主類別選項已更新，數量:', mainCategorySelect.options.length);
            }

            amountInput.addEventListener('input', () => {
                updateMainCategories(amountInput, mainCategorySelect);
            });
            
            // 初始化時也調用一次，確保頁面加載時有正確的狀態
            console.log('初始化類別選擇器...');
            updateMainCategories(amountInput, mainCategorySelect);

            // 編輯表單的事件監聽器（保持原有邏輯，因為編輯表單仍有類型選擇器）
            editTypeSelect.addEventListener('change', () => {
                updateMainCategories(editTypeSelect, editMainCategorySelect);
            });
        }

        // 處理類型變化
        function handleTypeChange() {
            const typeSelect = document.getElementById('type');
            const amountInput = document.getElementById('amount');
            const mainCategorySelect = document.getElementById('mainCategory');
            
            updateMainCategories(typeSelect, mainCategorySelect);
        }

        // 處理主類別變化
        function handleMainCategoryChange() {
            const mainCategorySelect = document.getElementById('mainCategory');
            const customInput = document.getElementById('customMainCategory');
            
            if (mainCategorySelect.value === '其他') {
                customInput.style.display = 'block';
                customInput.required = true;
            } else {
                customInput.style.display = 'none';
                customInput.required = false;
                customInput.value = '';
            }
        }

        // 處理編輯表單主類別變化
        function handleEditMainCategoryChange() {
            const mainCategorySelect = document.getElementById('editMainCategory');
            const customInput = document.getElementById('editCustomMainCategory');
            
            if (mainCategorySelect.value === '其他') {
                customInput.style.display = 'block';
                customInput.required = true;
            } else {
                customInput.style.display = 'none';
                customInput.required = false;
                customInput.value = '';
            }
        }

        function showTab(tabName) {
            // 隱藏所有標籤內容
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // 移除所有標籤的活動狀態
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // 顯示選中的標籤內容
            document.getElementById(tabName).classList.add('active');
            
            // 添加選中標籤的活動狀態
            const navTabs = document.querySelectorAll('.nav-tab');
            navTabs.forEach(tab => {
                if (tab.textContent.includes(tabName === 'dashboard' ? '總覽' : 
                                           tabName === 'list' ? '列表' :
                                           tabName === 'calendar' ? '日曆' :
                                           tabName === 'add' ? '新增' :
                                           tabName === 'import' ? '設定' : '')) {
                    tab.classList.add('active');
                }
            });

            // 如果切換到日曆頁面，更新日曆
            if (tabName === 'calendar') {
                setTimeout(() => {
                    updateCalendar();
                }, 100);
            }
            
            // 如果切換到圖表頁面，初始化圖表
            if (tabName === 'charts') {
                setTimeout(() => {
                    initializeCharts();
                }, 100);
            }
            
            // 如果切換到設定頁面，更新同步狀態
            if (tabName === 'import') {
                updateSyncStatus();
                // Token管理功能已移除 - 備份功能已移除
            }
        }

        // 更新數據統計顯示
        function updateDataStats() {
            try {
                const totalRecords = records.length;
                const totalIncome = records
                    .filter(r => r.type === 'income')
                    .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
                const totalExpense = records
                    .filter(r => r.type === 'expense')
                    .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
                
                console.log('📊 數據統計更新:', {
                    totalRecords,
                    totalIncome,
                    totalExpense,
                    balance: totalIncome - totalExpense
                });
                
                // 更新統計顯示（如果存在相關元素）
                const statsElements = document.querySelectorAll('[data-stat]');
                statsElements.forEach(element => {
                    const statType = element.getAttribute('data-stat');
                    switch(statType) {
                        case 'total-records':
                            element.textContent = totalRecords;
                            break;
                        case 'total-income':
                            element.textContent = `$${totalIncome.toLocaleString()}`;
                            break;
                        case 'total-expense':
                            element.textContent = `$${totalExpense.toLocaleString()}`;
                            break;
                        case 'balance':
                            element.textContent = `$${(totalIncome - totalExpense).toLocaleString()}`;
                            break;
                    }
                });
                
            } catch (error) {
                console.error('❌ 更新數據統計失敗:', error);
            }
        }

        function updateStats() {
            // 獲取篩選後的記錄
            const filteredRecords = getFilteredRecords('dashboard');
            
            // 調試：檢查記錄數量和重複ID
            console.log('🔍 updateStats調試信息:');
            console.log('- 總記錄數:', records.length);
            console.log('- 篩選後記錄數:', filteredRecords.length);
            console.log('- 記錄ID列表:', records.map(r => r.id));
            
            // 檢查重複ID
            const duplicateIds = records.map(r => r.id).filter((id, index, arr) => arr.indexOf(id) !== index);
            if (duplicateIds.length > 0) {
                console.warn('⚠️ 發現重複ID:', duplicateIds);
            }
            
            const totalIncome = filteredRecords
                .filter(record => record.type === 'income')
                .reduce((sum, record) => sum + record.amount, 0);
            
            const totalExpense = filteredRecords
                .filter(record => record.type === 'expense')
                .reduce((sum, record) => sum + record.amount, 0);
            
            console.log('- 總收入:', totalIncome);
            console.log('- 總支出:', totalExpense);
            
            // 計算現金支出（所有成員的現金支出）
            const cashExpense = filteredRecords
                .filter(record => record.type === 'expense' && record.subCategory === '現金')
                .reduce((sum, record) => sum + record.amount, 0);
            
            // 計算現金收入（所有成員的現金收入）
            const cashIncome = filteredRecords
                .filter(record => record.type === 'income' && record.subCategory === '現金')
                .reduce((sum, record) => sum + record.amount, 0);
            
            // 計算現金餘額 = 所有成員的現金收入 - 所有成員的現金支出
            const cashBalance = cashIncome - cashExpense;
            
            // 調試信息
            console.log('💰 現金統計調試:');
            console.log('- 所有成員現金收入:', cashIncome);
            console.log('- 所有成員現金支出:', cashExpense);
            console.log('- 現金餘額 (所有成員現金收入-所有成員現金支出):', cashBalance);
            
            // 詳細調試：檢查現金收入記錄
            const cashIncomeRecords = filteredRecords.filter(record => record.type === 'income' && record.subCategory === '現金');
            console.log('📊 現金收入記錄詳情:', cashIncomeRecords);
            
            // 詳細調試：檢查現金支出記錄
            const cashExpenseRecords = filteredRecords.filter(record => record.type === 'expense' && record.subCategory === '現金');
            console.log('📊 現金支出記錄詳情:', cashExpenseRecords);
            
            // 檢查所有記錄的 subCategory 類型
            const allSubCategories = [...new Set(filteredRecords.map(r => r.subCategory))];
            console.log('📊 所有 subCategory 類型:', allSubCategories);
            
            // 計算信用卡支出
            const creditExpense = filteredRecords
                .filter(record => record.type === 'expense' && record.subCategory === '信用卡')
                .reduce((sum, record) => sum + record.amount, 0);
            
            // 計算當月現金流（當月家用收入 - 當月現金支出）
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const monthlyHouseholdIncome = records
                .filter(record => {
                    const recordDate = new Date(record.date);
                    return record.member === '家用' && 
                           record.type === 'income' &&
                           recordDate.getMonth() === currentMonth && 
                           recordDate.getFullYear() === currentYear;
                })
                .reduce((sum, record) => sum + record.amount, 0);
            
            const monthlyCashExpense = records
                .filter(record => {
                    const recordDate = new Date(record.date);
                    return record.type === 'expense' && 
                           record.subCategory === '現金' &&
                           recordDate.getMonth() === currentMonth && 
                           recordDate.getFullYear() === currentYear;
                })
                .reduce((sum, record) => sum + record.amount, 0);
            
            // 當月現金流 = 當月家用收入 - 當月現金支出
            const monthlyCashFlow = monthlyHouseholdIncome - monthlyCashExpense;

            document.getElementById('totalExpense').textContent = `$${totalExpense.toLocaleString()}`;
            document.getElementById('creditExpense').textContent = `$${creditExpense.toLocaleString()}`;
            
            // 現金餘額顯示（所有現金收入 - 所有現金支出，帶顏色）
            const cashBalanceElement = document.getElementById('balance');
            const cashBalancePrefix = cashBalance >= 0 ? '+' : '';
            cashBalanceElement.textContent = `${cashBalancePrefix}$${Math.abs(cashBalance).toLocaleString()}`;
            cashBalanceElement.style.color = cashBalance >= 0 ? '#4CAF50' : '#F44336';

            // 更新各成員統計
            updateMemberStats();
            
            // 檢查並顯示滑動指示器
            setTimeout(() => {
                checkScrollable(document.querySelector('.stats'), document.getElementById('statsSwipeIndicator'));
                checkScrollable(document.querySelector('.member-stats-grid'), document.getElementById('memberSwipeIndicator'));
            }, 100);
        }

        function updateMemberStats() {
            const memberStatsContainer = document.getElementById('memberStats');
            const memberIndicatorsContainer = document.getElementById('memberIndicators');
            memberStatsContainer.innerHTML = '';
            memberIndicatorsContainer.innerHTML = '';

            const filteredRecords = getFilteredRecords('dashboard');
            console.log('updateMemberStats: 總記錄數', records.length);
            console.log('updateMemberStats: 篩選後記錄數', filteredRecords.length);
            console.log('updateMemberStats: 記錄內容', records);

            // 重新排列成員順序，讓第一個成員在中間
            const reorderedMembers = [...familyMembers];
            if (reorderedMembers.length > 1) {
                const firstMember = reorderedMembers.shift();
                reorderedMembers.splice(1, 0, firstMember); // 將第一個成員插入到第二個位置（中間）
            }
            
            reorderedMembers.forEach((member, index) => {
                const memberRecords = filteredRecords.filter(record => record.member === member);
                console.log(`${member} 的記錄:`, memberRecords);
                
                const memberIncome = memberRecords
                    .filter(record => record.type === 'income')
                    .reduce((sum, record) => sum + record.amount, 0);
                const memberExpense = memberRecords
                    .filter(record => record.type === 'expense')
                    .reduce((sum, record) => sum + record.amount, 0);
                const memberBalance = memberIncome - memberExpense;
                
                console.log(`${member} 統計: 收入=${memberIncome}, 支出=${memberExpense}, 餘額=${memberBalance}`);
                console.log(`${member} 記錄詳情:`, memberRecords.map(r => ({
                    date: r.date,
                    type: r.type,
                    amount: r.amount,
                    description: r.description
                })));

                const memberCard = document.createElement('div');
                memberCard.className = 'stat-card';
                memberCard.style.cursor = 'pointer';
                memberCard.innerHTML = `
                    <h4>${member}</h4>
                    <small>收入: $${memberIncome.toLocaleString()}</small>
                            <small>支出: $${memberExpense.toLocaleString()}</small>
                    <div class="balance" style="color: ${memberBalance >= 0 ? '#51cf66' : '#ff6b6b'};">
                            $${memberBalance.toLocaleString()}
                        </div>
                    <div class="view-details">
                        點擊查看詳細記錄
                    </div>
                `;
                
                // 添加點擊事件
                memberCard.addEventListener('click', () => {
                    showMemberRecords(member);
                });
                
                memberStatsContainer.appendChild(memberCard);
                
                // 創建成員指示器
                const indicator = document.createElement('div');
                indicator.className = 'member-indicator';
                if (index === 1) indicator.classList.add('active'); // 第二個位置（中間）為預設活動
                indicator.addEventListener('click', () => {
                    scrollToMember(index);
                });
                memberIndicatorsContainer.appendChild(indicator);
            });
            
            // 初始化滑動功能
            initializeMemberSwipe();
            
            // 調試信息
            console.log('📱 成員統計初始化完成');
            console.log('📱 成員數量:', reorderedMembers.length);
            console.log('📱 容器:', memberStatsContainer);
            console.log('📱 容器樣式:', window.getComputedStyle(memberStatsContainer).display);
        }
        
        // 初始化成員滑動功能
        function initializeMemberSwipe() {
            const memberStatsGrid = document.querySelector('.member-stats-grid');
            const indicators = document.querySelectorAll('.member-indicator');
            
            if (!memberStatsGrid) return;
            
            let currentIndex = 1; // 預設顯示中間的卡片（第二個位置）
            
            // 滑動到指定成員
            function scrollToMember(index) {
                const cardWidth = 280; // 固定卡片寬度
                memberStatsGrid.scrollTo({
                    left: index * cardWidth,
                    behavior: 'smooth'
                });
                updateActiveIndicator(index);
                currentIndex = index;
            }
            
            // 強制重新渲染
            memberStatsGrid.style.display = 'none';
            memberStatsGrid.offsetHeight; // 觸發重排
            memberStatsGrid.style.display = 'flex';
            
            // 初始化時滑動到中間位置
            setTimeout(() => {
                scrollToMember(1);
            }, 200);
            
            // 更新活動指示器
            function updateActiveIndicator(index) {
                indicators.forEach((indicator, i) => {
                    indicator.classList.toggle('active', i === index);
                });
            }
            
            // 監聽滑動事件
            memberStatsGrid.addEventListener('scroll', () => {
                const cardWidth = 280; // 固定卡片寬度
                const scrollLeft = memberStatsGrid.scrollLeft;
                const newIndex = Math.round(scrollLeft / cardWidth);
                
                if (newIndex !== currentIndex && newIndex >= 0 && newIndex < indicators.length) {
                    currentIndex = newIndex;
                    updateActiveIndicator(currentIndex);
                }
            });
            
            // 添加觸控滑動支持
            let startX = 0;
            let isScrolling = false;
            
            memberStatsGrid.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isScrolling = false;
            });
            
            memberStatsGrid.addEventListener('touchmove', (e) => {
                if (!isScrolling) {
                    const currentX = e.touches[0].clientX;
                    const diffX = Math.abs(currentX - startX);
                    
                    if (diffX > 10) {
                        isScrolling = true;
                    }
                }
            });
            
            memberStatsGrid.addEventListener('touchend', () => {
                if (isScrolling) {
                    const cardWidth = 280; // 固定卡片寬度
                    const scrollLeft = memberStatsGrid.scrollLeft;
                    const newIndex = Math.round(scrollLeft / cardWidth);
                    
                    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < indicators.length) {
                        currentIndex = newIndex;
                        updateActiveIndicator(currentIndex);
                    }
                }
            });
        }

        // 顯示成員詳細記錄（在總覽頁面下方顯示）
        function showMemberRecords(member) {
            const memberRecords = records.filter(record => record.member === member);
            
            if (memberRecords.length === 0) {
                alert(`${member} 目前沒有任何記錄。`);
                return;
            }
            
            // 計算收入和支出（與成員統計卡片邏輯一致）
            const memberIncome = memberRecords
                .filter(record => record.type === 'income')
                .reduce((sum, record) => sum + record.amount, 0);
            const memberExpense = memberRecords
                .filter(record => record.type === 'expense')
                .reduce((sum, record) => sum + record.amount, 0);
            const memberBalance = memberIncome - memberExpense;
            
            // 在總覽頁面下方顯示成員記錄
            displayMemberRecordsBelow(memberRecords, member, { income: memberIncome, expense: memberExpense, balance: memberBalance });
        }
        
        // 在總覽頁面下方顯示成員記錄
        function displayMemberRecordsBelow(memberRecords, member, stats) {
            // 按日期排序（最新的在前）
            memberRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // 查找或創建成員記錄顯示區域
            let memberRecordsContainer = document.getElementById('memberRecordsContainer');
            if (!memberRecordsContainer) {
                // 創建成員記錄顯示容器
                memberRecordsContainer = document.createElement('div');
                memberRecordsContainer.id = 'memberRecordsContainer';
                memberRecordsContainer.style.cssText = `
                    margin-top: 30px;
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    max-width: 100%;
                `;
                
                // 插入到總覽頁面內容的末尾
                const dashboardContent = document.getElementById('dashboard');
                dashboardContent.appendChild(memberRecordsContainer);
            }
            
            // 生成成員記錄HTML
            let recordsHtml = `
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h3 style="margin: 0; color: #333; font-size: 24px;">${member} 的記錄</h3>
                    <button onclick="clearMemberRecords()" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        padding: 8px 16px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">
                        關閉
                    </button>
                </div>
                
                <div style="
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    text-align: center;
                ">
                    <p style="margin: 0; font-size: 18px; color: #666;">
                        共 <strong style="color: #333;">${memberRecords.length}</strong> 筆記錄， 
                        收入：<strong style="color: #27ae60">$${stats.income.toLocaleString()}</strong> | 
                        支出：<strong style="color: #e74c3c">$${stats.expense.toLocaleString()}</strong> | 
                        餘額：<strong style="color: ${stats.balance >= 0 ? '#27ae60' : '#e74c3c'}">$${stats.balance.toLocaleString()}</strong>
                    </p>
                </div>
                
                <div class="member-records-list" style="max-height: 500px; overflow-y: auto;">
            `;
            
            memberRecords.forEach(record => {
                const amount = record.amount;
                const prefix = record.type === 'income' ? '+' : '-';
                
                recordsHtml += `
                    <div class="record-item" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 15px;
                        margin: 8px 0;
                        background: #f8f9fa;
                        border-radius: 8px;
                        border-left: 4px solid ${record.type === 'income' ? '#27ae60' : '#e74c3c'};
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.background='#e9ecef'" onmouseout="this.style.transform='translateY(0)'; this.style.background='#f8f9fa'">
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: #333; margin-bottom: 4px;">
                                ${record.date} - ${record.member}
                            </div>
                            <div style="color: #666; font-size: 14px;">
                                ${record.mainCategory}${record.subCategory ? ' - ' + record.subCategory : ''}
                                ${record.description ? ' - ' + record.description : ''}
                            </div>
                        </div>
                        <div style="
                            font-size: 18px;
                            font-weight: bold;
                            color: ${record.type === 'income' ? '#27ae60' : '#e74c3c'};
                        ">
                            ${prefix}$${Math.abs(record.amount).toLocaleString()}
                        </div>
                    </div>
                `;
            });
            
            recordsHtml += `</div>`;
            
            // 更新容器內容
            memberRecordsContainer.innerHTML = recordsHtml;
            
            // 滾動到成員記錄區域
            memberRecordsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // 清除成員記錄顯示
        function clearMemberRecords() {
            const container = document.getElementById('memberRecordsContainer');
            if (container) {
                container.remove();
            }
        }

        // 顯示總支出記錄
        function showExpenseRecords() {
            console.log('showExpenseRecords 被調用');
            console.log('當前記錄總數:', records.length);
            console.log('記錄內容:', records);
            
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            console.log('當前月份:', currentMonth, '當前年份:', currentYear);
            
            // 暫時移除日期篩選，顯示所有支出記錄
            const expenseRecords = records.filter(record => {
                const isExpense = record.type === 'expense';
                console.log(`記錄 ${record.id}: 成員=${record.member}, 是支出=${isExpense}`);
                return isExpense;
            });
            
            console.log('篩選後的支出記錄:', expenseRecords);
            
            const totalAmount = expenseRecords.reduce((sum, record) => sum + record.amount, 0);
            
            updateFilterTabs('expense');
            displayRecords(expenseRecords, `總支出記錄 (共 ${expenseRecords.length} 筆，$${totalAmount.toLocaleString()})`);
        }

        // 顯示現金支出記錄
        function showCashExpenseRecords() {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const cashExpenseRecords = records.filter(record => {
                const recordDate = new Date(record.date);
                return record.type === 'expense' && 
                       record.subCategory === '現金' &&
                       recordDate.getMonth() === currentMonth && 
                       recordDate.getFullYear() === currentYear;
            });
            
            const totalAmount = cashExpenseRecords.reduce((sum, record) => sum + record.amount, 0);
            
            updateFilterTabs('cash');
            displayRecords(cashExpenseRecords, `當月現金支出記錄 (共 ${cashExpenseRecords.length} 筆，$${totalAmount.toLocaleString()})`);
        }

        // 顯示信用卡支出記錄
        function showCreditExpenseRecords() {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const creditExpenseRecords = records.filter(record => {
                const recordDate = new Date(record.date);
                return record.type === 'expense' && 
                       record.subCategory === '信用卡' &&
                       recordDate.getMonth() === currentMonth && 
                       recordDate.getFullYear() === currentYear;
            });
            
            const totalAmount = creditExpenseRecords.reduce((sum, record) => sum + record.amount, 0);
            
            updateFilterTabs('credit');
            displayRecords(creditExpenseRecords, `當月信用卡支出記錄 (共 ${creditExpenseRecords.length} 筆，$${totalAmount.toLocaleString()})`);
        }

        // 顯示總收入記錄
        function showIncomeRecords() {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const incomeRecords = records.filter(record => {
                const recordDate = new Date(record.date);
                return record.member === '家用' && record.type === 'income' && 
                       recordDate.getMonth() === currentMonth && 
                       recordDate.getFullYear() === currentYear;
            });
            
            const totalAmount = incomeRecords.reduce((sum, record) => sum + record.amount, 0);
            
            updateFilterTabs('income');
            displayRecords(incomeRecords, `當月總收入記錄 (共 ${incomeRecords.length} 筆，$${totalAmount.toLocaleString()})`);
        }

        // 顯示全部記錄
        function showAllRecords() {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const allRecords = records.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.getMonth() === currentMonth && 
                       recordDate.getFullYear() === currentYear;
            });
            
            const totalIncome = allRecords.filter(r => r.member === '家用' && r.type === 'income').reduce((sum, record) => sum + record.amount, 0);
            const totalExpense = allRecords.filter(r => r.member === '家用' && r.type === 'expense').reduce((sum, record) => sum + record.amount, 0);
            const netAmount = totalIncome - totalExpense;
            
            updateFilterTabs('all');
            displayRecords(allRecords, `當月全部記錄 (共 ${allRecords.length} 筆，$${netAmount.toLocaleString()})`);
        }

        // 更新標籤頁狀態
        function updateFilterTabs(activeType) {
            const tabs = document.querySelectorAll('.filter-tab');
            console.log('更新標籤頁狀態:', activeType, '標籤數量:', tabs.length);
            
            tabs.forEach(tab => {
                tab.classList.remove('active');
                console.log('移除active類別:', tab.textContent);
            });
            
            if (activeType === 'expense') {
                if (tabs[0]) {
                    tabs[0].classList.add('active');
                    console.log('設置總支出為active:', tabs[0].textContent);
                }
            } else if (activeType === 'cash') {
                if (tabs[1]) {
                    tabs[1].classList.add('active');
                    console.log('設置現金支出為active:', tabs[1].textContent);
                }
            } else if (activeType === 'credit') {
                if (tabs[2]) {
                    tabs[2].classList.add('active');
                    console.log('設置信用卡支出為active:', tabs[2].textContent);
                }
            } else if (activeType === 'income') {
                if (tabs[3]) {
                    tabs[3].classList.add('active');
                    console.log('設置總收入為active:', tabs[3].textContent);
                }
            } else if (activeType === 'all') {
                if (tabs[4]) {
                    tabs[4].classList.add('active');
                    console.log('設置全部記錄為active:', tabs[4].textContent);
                }
            }
            // member 類型不更新標籤頁，保持當前狀態
        }

        // 顯示記錄的通用函數
        function displayRecords(recordsToShow, title) {
            console.log('displayRecords 被調用');
            console.log('要顯示的記錄數量:', recordsToShow.length);
            console.log('標題:', title);
            console.log('記錄內容:', recordsToShow);
            
            if (recordsToShow.length === 0) {
                console.log('沒有記錄要顯示，顯示空狀態');
                document.getElementById('recentRecords').innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <p>目前沒有任何記錄</p>
                    </div>
                `;
                return;
            }
            
            // 按日期排序（最新的在前）
            recordsToShow.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            let recordsHtml = `
                <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h4 style="color: #333; margin-bottom: 15px;">${title}</h4>
                    <div class="records-container">
            `;
            
            recordsToShow.forEach(record => {
                const amount = record.amount;
                const amountClass = record.type === 'income' ? 'income' : 'expense';
                const prefix = record.type === 'income' ? '+' : '-';
                
                recordsHtml += `
                    <div class="record-item ${amountClass}">
                        <div class="record-info">
                            <h4>${record.member} - ${record.mainCategory}${record.subCategory ? ' - ' + record.subCategory : ''}</h4>
                            <p>${record.description || '無描述'}</p>
                            <p>${record.date}</p>
                            </div>
                        <div class="record-amount" style="color: ${record.type === 'income' ? '#51cf66' : '#ff6b6b'};">
                                ${prefix}$${record.amount.toLocaleString()}
                        </div>
                    </div>
                `;
            });
            
            recordsHtml += `
                    </div>
                </div>
            `;
            
            document.getElementById('recentRecords').innerHTML = recordsHtml;
        }

        function updateRecentRecords() {
            const filteredRecords = getFilteredRecords('dashboard');
            const recentRecords = filteredRecords
                .sort((a, b) => new Date(convertDateToStandard(b.date)) - new Date(convertDateToStandard(a.date)))
                .slice(0, 5);
            
            const container = document.getElementById('recentRecords');
            container.innerHTML = '';
            
            if (recentRecords.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">尚無記錄</p>';
                return;
            }

            recentRecords.forEach(record => {
                const recordElement = createRecordElement(record);
                container.appendChild(recordElement);
            });
        }

        function updateAllRecords() {
            const container = document.getElementById('allRecords');
            container.innerHTML = '';
            
            if (records.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">尚無記錄</p>';
                return;
            }

            records
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .forEach(record => {
                    const recordElement = createRecordElement(record);
                    container.appendChild(recordElement);
                });
        }

        function createRecordElement(record) {
            const div = document.createElement('div');
            div.className = `record-item ${record.type}`;
            
            const amountClass = record.type === 'income' ? 'income' : 'expense';
            const amountPrefix = record.type === 'income' ? '+' : '-';
            const categoryText = record.subCategory ? `${record.mainCategory} - ${record.subCategory}` : record.mainCategory;
            
            div.innerHTML = `
                <div class="record-info">
                    <h4>${record.member} - ${categoryText}</h4>
                    <p>${record.description || '無描述'}</p>
                    <p>${new Date(record.date).toLocaleDateString('zh-TW')}</p>
                </div>
                <div class="record-amount ${amountClass}">
                    ${amountPrefix}$${record.amount.toLocaleString()}
                </div>
                <div class="record-actions">
                    <button class="btn btn-small" onclick="editRecord('${record.id}')">編輯</button>
                    <button class="btn btn-small btn-danger" onclick="deleteRecord('${record.id}')">刪除</button>
                </div>
            `;
            
            return div;
        }

        function updateCalendar() {
            const calendarTitle = document.getElementById('calendarTitle');
            const calendarGrid = document.getElementById('calendarGrid');
            
            calendarTitle.textContent = `${currentYear}年${currentMonth + 1}月`;
            
            // 清空日曆（不包含星期標題，因為HTML中已經有了）
            calendarGrid.innerHTML = '';
            
            // 獲取當月第一天和最後一天
            const firstDay = new Date(currentYear, currentMonth, 1);
            const lastDay = new Date(currentYear, currentMonth + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            // 生成42天（6週）
            for (let i = 0; i < 42; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                
                if (date.getMonth() !== currentMonth) {
                    dayElement.classList.add('other-month');
                }
                
                if (date.toDateString() === new Date().toDateString()) {
                    dayElement.classList.add('today');
                }
                
                const dateStr = formatDateToYYYYMMDD(date);
                dayElement.innerHTML = `
                    <div class="day-number">${date.getDate()}</div>
                    <div class="day-records" id="day-records-${dateStr}"></div>
                `;
                dayElement.id = `day-${dateStr}`;
                
                dayElement.onclick = () => showDayRecords(date);
                calendarGrid.appendChild(dayElement);
            }
            
            // 更新每日記錄
            updateDayRecords();
        }


        function filterRecords() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const memberFilter = document.getElementById('memberFilter').value;
            const typeFilter = document.getElementById('typeFilter').value;
            const dateFilter = document.getElementById('dateFilter').value;
            
            // 首先獲取月份篩選後的記錄
            let baseRecords = getFilteredRecords('list');
            
            const filteredRecords = baseRecords.filter(record => {
                const matchesSearch = !searchTerm || 
                    record.member.toLowerCase().includes(searchTerm) ||
                    record.mainCategory.toLowerCase().includes(searchTerm) ||
                    (record.subCategory && record.subCategory.toLowerCase().includes(searchTerm)) ||
                    record.description.toLowerCase().includes(searchTerm);
                
                const matchesMember = !memberFilter || record.member === memberFilter;
                
                const matchesType = !typeFilter || record.type === typeFilter;
                
                const matchesDate = !dateFilter || record.date === dateFilter;
                
                return matchesSearch && matchesMember && matchesType && matchesDate;
            });
            
            const container = document.getElementById('allRecords');
            container.innerHTML = '';
            
            if (filteredRecords.length === 0) {
                const selectElement = document.getElementById('listMonthSelect');
                if (selectElement && selectElement.value === '') {
                    container.innerHTML = '<p style="text-align: center; color: #666;">沒有符合條件的記錄</p>';
                } else {
                    container.innerHTML = `<p style="text-align: center; color: #666;">該月份沒有符合條件的記錄</p>`;
                }
                return;
            }
            
            filteredRecords
                .sort((a, b) => new Date(convertDateToStandard(b.date)) - new Date(convertDateToStandard(a.date)))
                .forEach(record => {
                    const recordElement = createRecordElement(record);
                    container.appendChild(recordElement);
                });
        }

        // 表單提交
        document.getElementById('recordForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // 數據驗證
            const member = document.getElementById('member').value;
            const type = document.getElementById('type').value;
            const amount = parseFloat(document.getElementById('amount').value);
            let mainCategory = document.getElementById('mainCategory').value;
            const customMainCategory = document.getElementById('customMainCategory').value;
            const subCategory = document.getElementById('subCategory').value;
            const date = document.getElementById('date').value;
            
            if (!member) {
                alert('請選擇成員！');
                return;
            }
            
            if (!type) {
                alert('請選擇類型（收入/支出）！');
                return;
            }
            
            if (!amount || amount === 0) {
                alert('請輸入有效的金額（正數）！');
                return;
            }
            
            if (!mainCategory) {
                alert('請選擇主類別！');
                return;
            }
            
            // 如果選擇了"其他"，使用自定義輸入
            if (mainCategory === '其他') {
                if (!customMainCategory.trim()) {
                    alert('請輸入自定義主類別！');
                    return;
                }
                mainCategory = customMainCategory.trim();
            }
            
            if (!subCategory) {
                alert('請選擇付款方式！');
                return;
            }
            
            if (!date) {
                alert('請選擇日期！');
                return;
            }
            
            // 檢查日期是否為未來日期
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(23, 59, 59, 999); // 設為今天的結束時間
            
            if (selectedDate > today) {
                alert('不能選擇未來的日期！');
                return;
            }
            
            const record = {
                id: Date.now().toString(),
                member: member,
                type: type,
                amount: amount, // 存儲正數金額
                mainCategory: mainCategory,
                subCategory: subCategory,
                description: document.getElementById('description').value,
                date: date
            };
            
            try {
                console.log('➕ 開始向JSON文件添加記錄...');
                
                // 使用JSON文件添加API
                const addResponse = await fetch(ENV_CONFIG.getApiBase() + '/api/records', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(record)
                });
                
                const addResult = await addResponse.json();
                
                if (addResult.success) {
                    console.log('✅ 記錄已添加:', addResult.message);
                    showNotification('記錄添加成功，已保存到本地文件', 'success');
                    
                    // 添加到前端數組
                    records.push(record);
                    // localStorage緩存已移除
            
            // 重置表單
            this.reset();
            setTodayDate();
            
            // 更新顯示
            updateStats();
            updateRecentRecords();
            updateAllRecords();
                    updateCalendar();
                    updateSyncStatus();
                    
                    alert('✅ 記錄已成功新增！');
                } else {
                    console.error('❌ JSON文件添加失敗:', addResult.message);
                    alert('❌ 記錄添加失敗：' + addResult.message);
                }
            } catch (error) {
                console.error('❌ 添加記錄時發生錯誤:', error);
                alert('❌ 添加記錄時發生錯誤：' + error.message);
            }
        });

        function editRecord(id) {
            const record = records.find(r => r.id === id);
            if (!record) return;
            
            document.getElementById('editId').value = record.id;
            document.getElementById('editMember').value = record.member;
            document.getElementById('editType').value = record.type;
            document.getElementById('editAmount').value = record.amount;
            
            // 更新類別選項
            const editTypeSelect = document.getElementById('editType');
            const editMainCategorySelect = document.getElementById('editMainCategory');
            const editSubCategorySelect = document.getElementById('editSubCategory');
            
            // 先更新主類別選項
            const type = editTypeSelect.value;
            editMainCategorySelect.innerHTML = '<option value="">請選擇</option>';
            if (type === 'income') {
                categories.income.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    editMainCategorySelect.appendChild(option);
                });
            } else if (type === 'expense') {
                // 獲取所有支出類別（排除"其他"）
                const expenseCategories = Object.keys(categories.expense).filter(cat => cat !== '其他');
                expenseCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    editMainCategorySelect.appendChild(option);
                });
                // 添加"其他"選項
                const otherOption = document.createElement('option');
                otherOption.value = '其他';
                otherOption.textContent = '其他';
                editMainCategorySelect.appendChild(otherOption);
            }
            
            // 然後設置主類別值
            const predefinedCategories = [...categories.income, ...Object.keys(categories.expense)];
            if (predefinedCategories.includes(record.mainCategory)) {
                document.getElementById('editMainCategory').value = record.mainCategory;
                document.getElementById('editCustomMainCategory').style.display = 'none';
                document.getElementById('editCustomMainCategory').value = '';
            } else {
                document.getElementById('editMainCategory').value = '其他';
                document.getElementById('editCustomMainCategory').style.display = 'block';
                document.getElementById('editCustomMainCategory').value = record.mainCategory;
            }
            
            document.getElementById('editSubCategory').value = record.subCategory;
            document.getElementById('editDescription').value = record.description;
            document.getElementById('editDate').value = record.date;
            
            // 更新子類別（付款方式）
            const mainCategory = editMainCategorySelect.value;
            editSubCategorySelect.innerHTML = '<option value="">請選擇付款方式</option>';
            
            // 添加付款方式選項
            const paymentMethods = ['信用卡', '現金'];
            paymentMethods.forEach(method => {
                const option = document.createElement('option');
                option.value = method;
                option.textContent = method;
                editSubCategorySelect.appendChild(option);
            });
            
            // 如果有預定義的子類別，也添加它們
            if (type === 'expense' && mainCategory && categories.expense[mainCategory]) {
                categories.expense[mainCategory].forEach(subCategory => {
                    // 避免重複添加付款方式
                    if (!paymentMethods.includes(subCategory)) {
                        const option = document.createElement('option');
                        option.value = subCategory;
                        option.textContent = subCategory;
                        editSubCategorySelect.appendChild(option);
                    }
                });
            }
            
            document.getElementById('editModal').style.display = 'block';
        }

        function closeModal() {
            document.getElementById('editModal').style.display = 'none';
        }

        document.getElementById('editForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // 數據驗證
            const member = document.getElementById('editMember').value;
            const type = document.getElementById('editType').value;
            const amount = parseFloat(document.getElementById('editAmount').value);
            let mainCategory = document.getElementById('editMainCategory').value;
            const customMainCategory = document.getElementById('editCustomMainCategory').value;
            const subCategory = document.getElementById('editSubCategory').value;
            const date = document.getElementById('editDate').value;
            
            if (!member) {
                alert('請選擇成員！');
                return;
            }
            
            if (!type) {
                alert('請選擇類型！');
                return;
            }
            
            if (!amount || amount <= 0) {
                alert('請輸入有效的金額！');
                return;
            }
            
            if (!mainCategory) {
                alert('請選擇主類別！');
                return;
            }
            
            // 如果選擇了"其他"，使用自定義輸入
            if (mainCategory === '其他') {
                if (!customMainCategory.trim()) {
                    alert('請輸入自定義主類別！');
                    return;
                }
                mainCategory = customMainCategory.trim();
            }
            
            if (!subCategory) {
                alert('請選擇付款方式！');
                return;
            }
            
            if (!date) {
                alert('請選擇日期！');
                return;
            }
            
            // 檢查日期是否為未來日期
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            
            if (selectedDate > today) {
                alert('不能選擇未來的日期！');
                return;
            }
            
            const id = document.getElementById('editId').value;
            const recordIndex = records.findIndex(r => r.id === id);
            
            if (recordIndex !== -1) {
                // 準備更新數據
                const updatedRecord = {
                    id: id,
                    member: member,
                    type: type,
                    amount: amount,
                    mainCategory: mainCategory,
                    subCategory: subCategory,
                    description: document.getElementById('editDescription').value,
                    date: date
                };
                
                try {
                    // 調用後端 API 更新記錄
                    const response = await fetch(ENV_CONFIG.getApiBase() + `/api/records/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updatedRecord)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        console.log('✅ 記錄已更新:', result.message);
                        showNotification('記錄更新成功，已保存到本地文件', 'success');
                        
                        // 更新前端數組
                        records[recordIndex] = updatedRecord;
                        
                        updateStats();
                        updateRecentRecords();
                        updateAllRecords();
                        updateCalendar();
                        closeModal();
                    } else {
                        console.error('❌ 更新記錄失敗:', result.message);
                        alert('❌ 更新記錄失敗: ' + result.message);
                    }
                } catch (error) {
                    console.error('❌ 更新記錄時發生錯誤:', error);
                    alert('❌ 更新記錄時發生錯誤：' + error.message);
                }
            }
        });

        async function deleteRecord(id) {
            if (confirm('確定要刪除這筆記錄嗎？')) {
                try {
                    console.log('🗑️ 開始從JSON文件刪除記錄:', id);
                    
                    // 使用JSON文件刪除API
                    const deleteResponse = await fetch(ENV_CONFIG.getApiBase() + `/api/records/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    
                    const deleteResult = await deleteResponse.json();
                    
                    if (deleteResult.success) {
                        console.log('✅ 記錄已刪除:', deleteResult.message);
                        showNotification('記錄刪除成功，已保存到本地文件', 'success');
                        
                        // 從前端數組中移除記錄
                records = records.filter(record => record.id !== id);
                        // localStorage緩存已移除
                        
                        // 更新所有顯示
                updateStats();
                updateRecentRecords();
                updateAllRecords();
                        updateCalendar();
                        updateSyncStatus();
                        
                        alert('✅ 記錄已成功刪除！');
                    } else {
                        console.error('❌ JSON文件刪除失敗:', deleteResult.message);
                        alert('❌ 記錄刪除失敗：' + deleteResult.message);
                    }
                } catch (error) {
                    console.error('❌ 刪除記錄時發生錯誤:', error);
                    alert('❌ 刪除記錄時發生錯誤：' + error.message);
                }
            }
        }

        // saveRecords函數已移除 - 數據直接保存到JSON文件

        // 寫入 data.json 檔案（通過下載方式）
        function saveToDataJson() {
            try {
                const now = new Date();
                const dataToSave = {
                    records: records,
                    settings: {
                        version: "1.0",
                        lastUpdated: now.toISOString()
                    }
                };
                
                // 備份時間記錄已移除
                
                // 創建並下載 data.json 檔案
                const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'data.json';
                
                // 靜默下載（不顯示下載對話框）
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                console.log('成功生成 data.json 備份檔案');
                
                // 更新統計顯示
                // updateDataStats(); // 已移除，避免覆蓋月份篩選統計
            } catch (error) {
                console.warn('無法生成 data.json 備份檔案:', error);
            }
        }

        function checkRecurringExpenses() {
            const today = new Date();
            const currentDay = today.getDate();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            
            recurringExpenses.forEach(expense => {
                // 檢查是否已經記錄了這個月的固定支出
                const thisMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
                const existingRecord = records.find(record => 
                    record.member === expense.member &&
                    record.description.includes(expense.name) &&
                    record.date.startsWith(thisMonth)
                );
                
                // 如果今天是固定支出的日期且還沒有記錄，顯示提醒
                if (currentDay === expense.day && !existingRecord) {
                    const confirmAdd = confirm(`提醒：今天是 ${expense.name} 的繳費日（$${expense.amount.toLocaleString()}），是否要新增這筆記錄？`);
                    if (confirmAdd) {
                        // 根據費用名稱決定正確的類別
                        let mainCategory, subCategory;
                        if (expense.name === '房租') {
                            mainCategory = '居住';
                            subCategory = '房租';
                        } else if (expense.name === '房貸') {
                            mainCategory = '居住';
                            subCategory = '房貸';
                        } else if (expense.name === '手機費') {
                            mainCategory = '日常';
                            subCategory = '手機費';
                        } else if (expense.name === '網路費') {
                            mainCategory = '日常';
                            subCategory = '網路費';
                        }
                        
                        const record = {
                            id: Date.now().toString(),
                            member: expense.member,
                            type: 'expense',
                            amount: expense.amount,
                            mainCategory: mainCategory,
                            subCategory: subCategory,
                            description: `${expense.name} - ${thisMonth}`,
                            date: today.toISOString().split('T')[0]
                        };
                        
                        records.push(record);
                        // saveRecords() 已移除 - 數據直接保存到JSON文件
                        updateStats();
                        updateRecentRecords();
                        updateAllRecords();
                        updateCalendar();
                        
                        // 自動備份到GitHub - 已移除
                        
                        alert(`${expense.name} 記錄已新增！`);
                    }
                }
            });
        }

        // 點擊模態框外部關閉
        window.onclick = function(event) {
            const modal = document.getElementById('editModal');
            if (event.target === modal) {
                closeModal();
            }
        }

        // CSV 匯入功能
        function handleCSVImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            Papa.parse(file, {
                header: true,
                complete: function(results) {
                    if (results.errors.length > 0) {
                        alert('CSV 檔案解析錯誤：' + results.errors[0].message);
                        return;
                    }
                    processImportData(results.data);
                },
                error: function(error) {
                    alert('讀取 CSV 檔案時發生錯誤：' + error.message);
                }
            });
        }

        // Excel 匯入功能
        function handleExcelImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // 使用 raw: false 來獲取格式化的值
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                        raw: false,
                        dateNF: 'yyyy-mm-dd' // 指定日期格式
                    });
                    
                    console.log('Excel 解析結果:', jsonData);
                    processImportData(jsonData);
                } catch (error) {
                    console.error('Excel 讀取錯誤:', error);
                    alert('讀取 Excel 檔案時發生錯誤：' + error.message);
                }
            };
            reader.readAsArrayBuffer(file);
        }

        // 處理匯入數據
        function processImportData(data) {
            importData = [];
            const errors = [];
            const warnings = [];

            console.log('原始數據:', data);

            data.forEach((row, index) => {
                console.log(`處理第 ${index + 1} 行:`, row);
                const record = validateImportRecord(row, index + 1);
                if (record) {
                    importData.push(record);
                } else {
                    errors.push(`第 ${index + 1} 行數據無效`);
                }
            });

            if (errors.length > 0) {
                alert('發現以下錯誤：\n' + errors.join('\n') + '\n\n請檢查數據格式是否正確。');
            }

            if (warnings.length > 0) {
                console.warn('警告:', warnings);
            }

            showImportPreview();
        }

        // 驗證匯入記錄
        function validateImportRecord(row, rowNumber) {
            const requiredFields = ['成員', '金額', '主類別', '子類別', '描述', '日期'];
            const errors = [];
            
            console.log(`驗證第 ${rowNumber} 行:`, row);
            
            // 檢查必要欄位
            for (let field of requiredFields) {
                if (!row[field] && row[field] !== 0) {
                    errors.push(`缺少必要欄位：${field}`);
                }
            }
            
            // 驗證付款方式（子類別）
            const paymentMethod = row['子類別'];
            if (paymentMethod && !['信用卡', '現金'].includes(paymentMethod)) {
                errors.push(`付款方式無效：${paymentMethod} (有效值: 信用卡, 現金)`);
            }

            if (errors.length > 0) {
                console.error(`第 ${rowNumber} 行錯誤:`, errors);
                return null;
            }

            // 驗證成員
            if (!familyMembers.includes(row['成員'])) {
                errors.push(`成員無效：${row['成員']} (有效值: ${familyMembers.join(', ')})`);
            }

            // 驗證金額
            let amountValue = row['金額'];
            
            // 清理金額字符串
            if (typeof amountValue === 'string') {
                // 先處理括號格式（會計格式）
                if (amountValue.includes('(') && amountValue.includes(')')) {
                    amountValue = '-' + amountValue.replace(/[()]/g, '');
                }
                
                // 移除貨幣符號、空格等，但保留負號和逗號
                amountValue = amountValue.toString().replace(/[¥￥\s]/g, '');
                
                // 移除千分位逗號
                amountValue = amountValue.replace(/,/g, '');
                
                // 移除美元符號（在逗號處理後）
                amountValue = amountValue.replace(/\$/g, '');
            }
            
            const amount = parseFloat(amountValue);
            console.log(`第 ${rowNumber} 行金額解析:`, {
                '原始值': row['金額'],
                '清理後': amountValue,
                '解析後': amount,
                '類型': typeof row['金額']
            });
            
            if (isNaN(amount) || amount === 0) {
                errors.push(`金額無效：${row['金額']} (清理後: ${amountValue}, 解析後: ${amount})`);
            }

            // 根據金額正負數判斷類型
            const type = amount > 0 ? 'income' : 'expense';
            const absAmount = Math.abs(amount); // 內部存儲使用絕對值

            // 驗證日期
            let dateStr = row['日期'];
            // 處理不同的日期格式
            if (typeof dateStr === 'string') {
                // 如果是 Excel 日期數字，轉換為日期
                if (!isNaN(dateStr) && dateStr > 25569) { // Excel 日期起始值
                    const excelDate = new Date((dateStr - 25569) * 86400 * 1000);
                    dateStr = formatDateToYYYYMMDD(excelDate).replace(/-/g, '/'); // 轉換為 / 格式
                } else {
                    // 處理日期格式，統一轉換為 / 格式
                    if (dateStr.includes('-')) {
                        dateStr = dateStr.replace(/-/g, '/'); // 將 - 格式轉換為 / 格式
                    }
                    // 確保日期格式正確 (2025/9/1 -> 2025/9/1)
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        const year = parts[0];
                        const month = parts[1];
                        const day = parts[2];
                        dateStr = `${year}/${month}/${day}`;
                    }
                }
            }
            
            const date = new Date(dateStr.replace(/\//g, '-')); // 驗證時轉換為 - 格式
            if (isNaN(date.getTime())) {
                errors.push(`日期無效：${row['日期']} (格式: YYYY/M/D)`);
            }

            if (errors.length > 0) {
                console.error(`第 ${rowNumber} 行驗證失敗:`, errors);
                return null;
            }

            return {
                id: generateUniqueId(),
                member: row['成員'],
                type: type,
                amount: absAmount,
                mainCategory: row['主類別'],
                subCategory: row['子類別'],
                description: row['描述'] || '',
                date: dateStr
            };
        }

        // 顯示匯入預覽
        function showImportPreview() {
            const previewDiv = document.getElementById('importPreview');
            const tableBody = document.getElementById('previewTableBody');
            
            tableBody.innerHTML = '';
            
            importData.forEach((record, index) => {
                const row = document.createElement('tr');
                const isValid = validateRecord(record);
                
                const amountDisplay = record.type === 'income' ? 
                    `+$${record.amount.toLocaleString()}` : 
                    `-$${record.amount.toLocaleString()}`;
                
                row.innerHTML = `
                    <td>${record.member}</td>
                    <td style="color: ${record.type === 'income' ? '#51cf66' : '#ff6b6b'}">${amountDisplay}</td>
                    <td>${record.mainCategory}</td>
                    <td>${record.subCategory}</td>
                    <td>${record.description}</td>
                    <td>${record.date}</td>
                    <td class="${isValid ? 'status-valid' : 'status-invalid'}">
                        ${isValid ? '✓ 有效' : '✗ 無效'}
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            previewDiv.style.display = 'block';
        }

        // 驗證記錄
        function validateRecord(record) {
            return familyMembers.includes(record.member) &&
                   ['income', 'expense'].includes(record.type) &&
                   record.amount > 0 &&
                   record.mainCategory &&
                   record.date;
        }

        // 確認匯入
        function confirmImport() {
            const validRecords = importData.filter(record => validateRecord(record));
            
            if (validRecords.length === 0) {
                alert('沒有有效的記錄可以匯入！');
                return;
            }

            // 檢查重複記錄
            const duplicateCheck = checkForDuplicates(validRecords);
            const newRecords = duplicateCheck.newRecords;
            const duplicates = duplicateCheck.duplicates;

            if (duplicates.length > 0) {
                const duplicateInfo = duplicates.map(dup => 
                    `${dup.member} - ${dup.mainCategory} - $${dup.amount} - ${dup.date}`
                ).join('\n');
                
                if (newRecords.length === 0) {
                    alert(`所有記錄都是重複的！\n\n重複的記錄：\n${duplicateInfo}\n\n請檢查是否已經匯入過這些記錄。`);
                    return;
                } else {
                    const proceed = confirm(`發現 ${duplicates.length} 筆重複記錄，將跳過這些記錄。\n\n重複的記錄：\n${duplicateInfo}\n\n確定要匯入 ${newRecords.length} 筆新記錄嗎？`);
                    if (!proceed) {
                        return;
                    }
                }
            }

            if (confirm(`確定要匯入 ${newRecords.length} 筆記錄嗎？`)) {
                records = records.concat(newRecords);
                // saveRecords() 已移除 - 數據直接保存到JSON文件
                
                // 自動備份到GitHub - 已移除
                
                updateStats();
                updateRecentRecords();
                updateAllRecords();
                
                // 檢查是否需要切換到2025年
                checkAndSwitchTo2025();
                
                updateCalendar(); // 確保日曆更新
                updateSyncStatus(); // 更新同步狀態
                
                let message = `成功匯入 ${newRecords.length} 筆記錄！`;
                if (duplicates.length > 0) {
                    message += `\n跳過了 ${duplicates.length} 筆重複記錄。`;
                }
                alert(message);
                cancelImport();
            }
        }

        // 檢查重複記錄
        function checkForDuplicates(importRecords) {
            const newRecords = [];
            const duplicates = [];
            
            importRecords.forEach(importRecord => {
                // 檢查是否與現有記錄重複
                const isDuplicate = records.some(existingRecord => {
                    // 正規化日期格式進行比較
                    const existingDate = convertDateToStandard(existingRecord.date);
                    const importDate = convertDateToStandard(importRecord.date);
                    
                    return existingRecord.member === importRecord.member &&
                           existingRecord.amount === importRecord.amount &&
                           existingRecord.mainCategory === importRecord.mainCategory &&
                           existingRecord.subCategory === importRecord.subCategory &&
                           existingDate === importDate &&
                           existingRecord.description === importRecord.description;
                });
                
                if (isDuplicate) {
                    duplicates.push(importRecord);
                } else {
                    newRecords.push(importRecord);
                }
            });
            
            return { newRecords, duplicates };
        }

        // 取消匯入
        function cancelImport() {
            importData = [];
            document.getElementById('importPreview').style.display = 'none';
            document.getElementById('csvFile').value = '';
            document.getElementById('excelFile').value = '';
        }





        // 下載 Excel 格式備份（可重新匯入）
        function downloadExcelBackup() {
            if (records.length === 0) {
                alert('沒有記錄可以備份！');
                return;
            }

            // 將記錄轉換為 Excel 格式 (7欄格式)
            const excelData = records.map(record => ({
                '成員': record.member,
                '金額': record.amount, // 保持原始金額，不轉換正負號
                '類別': record.type === 'income' ? '收入' : '支出',
                '主類別': record.mainCategory,
                '付款方式': record.subCategory || '現金',
                '描述': record.description || '',
                '日期': record.date
            }));

            // 創建 Excel 工作表
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, '家庭收支記錄');
            
            // 下載檔案
            const fileName = `family_records_backup_${formatDateToYYYYMMDD(new Date())}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            alert(`成功下載 Excel 備份檔案！\n備份了 ${records.length} 筆記錄。\n檔案名: ${fileName}\n\n此檔案可以直接重新匯入系統。`);
        }











        // 更新數據統計
        // 更新同步狀態 - 已移除備份相關功能
        function updateSyncStatus() {
            // 同步狀態功能已移除 - 現在使用JSON文件存儲，不需要同步狀態
            // 只保留數據健康檢查
            checkDataHealth();
        }

        // 數據健康檢查
        function checkDataHealth() {
            console.log('🔍 開始數據健康檢查...');
            
            const healthIssues = [];
            const warnings = [];
            
            // 檢查記錄數量
            if (records.length === 0) {
                healthIssues.push('❌ 沒有數據記錄');
            } else if (records.length > 1000) {
                warnings.push('⚠️ 記錄數量過多 (' + records.length + ' 筆)');
            }
            
            // 檢查數據完整性
            const invalidRecords = records.filter(record => 
                !record.id || !record.member || !record.type || !record.amount || !record.date
            );
            if (invalidRecords.length > 0) {
                healthIssues.push(`❌ 發現 ${invalidRecords.length} 筆無效記錄`);
            }
            
            // 檢查重複記錄
            const duplicateIds = records.map(r => r.id).filter((id, index, arr) => arr.indexOf(id) !== index);
            if (duplicateIds.length > 0) {
                healthIssues.push(`❌ 發現 ${duplicateIds.length} 筆重複ID`);
            }
            
            // 檢查日期格式
            const invalidDates = records.filter(record => {
                const date = new Date(record.date);
                return isNaN(date.getTime());
            });
            if (invalidDates.length > 0) {
                healthIssues.push(`❌ 發現 ${invalidDates.length} 筆無效日期`);
            }
            
            // 檢查金額
            const invalidAmounts = records.filter(record => 
                isNaN(record.amount) || record.amount === 0
            );
            if (invalidAmounts.length > 0) {
                healthIssues.push(`❌ 發現 ${invalidAmounts.length} 筆無效金額`);
            }
            
            // localStorage檢查已移除 - 數據直接從JSON文件讀取
            
            // 更新健康狀態顯示
            let healthStatus = '✅ 健康';
            let healthColor = '#28a745';
            
            if (healthIssues.length > 0) {
                healthStatus = `❌ ${healthIssues.length} 個問題`;
                healthColor = '#dc3545';
            } else if (warnings.length > 0) {
                healthStatus = `⚠️ ${warnings.length} 個警告`;
                healthColor = '#ffc107';
            }
            
            const healthElement = document.getElementById('dataHealth');
            if (healthElement) {
                healthElement.textContent = healthStatus;
                healthElement.style.color = healthColor;
            }
            
            // 輸出詳細報告
            console.log('📊 數據健康檢查報告:');
            console.log(`總記錄數: ${records.length}`);
            console.log(`健康問題: ${healthIssues.length}`);
            console.log(`警告: ${warnings.length}`);
            
            if (healthIssues.length > 0) {
                console.log('❌ 健康問題:', healthIssues);
            }
            if (warnings.length > 0) {
                console.log('⚠️ 警告:', warnings);
            }
            
            return {
                healthy: healthIssues.length === 0,
                issues: healthIssues,
                warnings: warnings,
                totalRecords: records.length
            };
        }

        // GitHub Token 管理功能已移除 - 備份功能已移除
        async function checkTokenStatus() {
            console.log('🔑 Token管理功能已移除，跳過檢查...');
            
            // 檢查DOM元素是否存在，如果不存在則跳過
            const tokenStatus = document.getElementById('tokenStatus');
            const deleteBtn = document.getElementById('deleteTokenBtn');
            
            if (tokenStatus) {
                tokenStatus.innerHTML = `
                    <p>ℹ️ <strong>Token管理功能已移除</strong></p>
                    <p>系統現在使用JSON文件存儲，不再需要GitHub Token備份</p>
                `;
                tokenStatus.style.color = '#6c757d';
            }
            
            if (deleteBtn) {
                deleteBtn.style.display = 'none';
            }
        }

        async function saveGitHubToken() {
            alert('⚠️ Token管理功能已移除\n\n系統現在使用JSON文件存儲，不再需要GitHub Token備份功能。');
            return;
        }

        async function deleteGitHubToken() {
            alert('⚠️ Token管理功能已移除\n\n系統現在使用JSON文件存儲，不再需要GitHub Token備份功能。');
            return;
        }

        // 從備份恢復Token功能已移除
        async function recoverTokenFromBackup() {
            alert('⚠️ Token管理功能已移除\n\n系統現在使用JSON文件存儲，不再需要GitHub Token備份功能。');
            return;
        }

        // 快速修復功能
        async function quickFix() {
            console.log('🔧 開始快速修復...');
            
            const fixes = [];
            
            try {
                // 1. 強制重新載入數據
                console.log('🔄 步驟1: 強制重新載入數據...');
                await loadDataFromFile();
                fixes.push('✅ 重新載入數據');
                
                // 2. 檢查並修復重複ID
                console.log('🔍 步驟2: 檢查重複ID...');
                const duplicateIds = records.map(r => r.id).filter((id, index, arr) => arr.indexOf(id) !== index);
                if (duplicateIds.length > 0) {
                    // 為重複ID生成新的唯一ID
                    const idMap = new Map();
                    records.forEach(record => {
                        if (idMap.has(record.id)) {
                            record.id = Date.now() + Math.random().toString(36).substr(2, 9);
                        }
                        idMap.set(record.id, true);
                    });
                    fixes.push(`✅ 修復 ${duplicateIds.length} 個重複ID`);
                }
                
                // 3. 檢查並修復無效記錄
                console.log('🔍 步驟3: 檢查無效記錄...');
                const originalLength = records.length;
                records = records.filter(record => 
                    record.id && record.member && record.type && record.amount && record.date
                );
                const removedCount = originalLength - records.length;
                if (removedCount > 0) {
                    fixes.push(`✅ 移除 ${removedCount} 筆無效記錄`);
                }
                
                // 4. localStorage同步已移除
                console.log('💾 步驟4: localStorage同步已移除');
                fixes.push('✅ localStorage同步已移除');
                
                // 5. 更新所有顯示
                console.log('🔄 步驟5: 更新顯示...');
                updateStats();
                updateRecentRecords();
                updateAllRecords();
                updateCalendar();
                updateSyncStatus();
                fixes.push('✅ 更新所有顯示');
                
                // 6. 自動備份到GitHub - 已移除
                
                // 顯示修復結果
                const message = `🔧 快速修復完成！\n\n修復項目：\n${fixes.join('\n')}\n\n當前記錄數：${records.length}`;
                alert(message);
                console.log('✅ 快速修復完成:', fixes);
                
            } catch (error) {
                console.error('❌ 快速修復失敗:', error);
                alert('❌ 快速修復失敗：' + error.message);
            }
        }

        // 預覽刪除
        function previewDelete() {
            const memberFilter = document.getElementById('deleteMemberFilter').value;
            const typeFilter = document.getElementById('deleteTypeFilter').value;
            const dateFrom = document.getElementById('deleteDateFrom').value;
            const dateTo = document.getElementById('deleteDateTo').value;

            deleteData = records.filter(record => {
                const matchesMember = !memberFilter || record.member === memberFilter;
                const matchesType = !typeFilter || record.type === typeFilter;
                const matchesDateFrom = !dateFrom || record.date >= dateFrom;
                const matchesDateTo = !dateTo || record.date <= dateTo;

                return matchesMember && matchesType && matchesDateFrom && matchesDateTo;
            });

            if (deleteData.length === 0) {
                alert('沒有符合條件的記錄可以刪除！');
                return;
            }

            showDeletePreview();
        }

        // 顯示刪除預覽
        function showDeletePreview() {
            const previewDiv = document.getElementById('deletePreview');
            const tableBody = document.getElementById('deletePreviewTableBody');
            
            tableBody.innerHTML = '';
            
            deleteData.forEach((record, index) => {
                const row = document.createElement('tr');
                const amountDisplay = record.type === 'income' ? 
                    `+$${record.amount.toLocaleString()}` : 
                    `-$${record.amount.toLocaleString()}`;
                
                row.innerHTML = `
                    <td>${record.member}</td>
                    <td style="color: ${record.type === 'income' ? '#51cf66' : '#ff6b6b'}">${amountDisplay}</td>
                    <td>${record.mainCategory}</td>
                    <td>${record.subCategory}</td>
                    <td>${record.description}</td>
                    <td>${record.date}</td>
                `;
                
                tableBody.appendChild(row);
            });
            
            previewDiv.style.display = 'block';
        }

        // 確認刪除
        function confirmDelete() {
            if (confirm(`確定要刪除 ${deleteData.length} 筆記錄嗎？此操作無法復原！`)) {
                // 從 records 中移除要刪除的記錄
                records = records.filter(record => !deleteData.includes(record));
                
                // saveRecords() 已移除 - 數據直接保存到JSON文件
                updateStats();
                updateRecentRecords();
                updateAllRecords();
                updateCalendar(); // 確保日曆更新
                // updateDataStats(); // 已移除，避免覆蓋月份篩選統計
                cancelDelete();
                
                // 自動備份到GitHub - 已移除
                
                alert(`成功刪除 ${deleteData.length} 筆記錄！`);
            }
        }

        // 取消刪除
        function cancelDelete() {
            deleteData = [];
            document.getElementById('deletePreview').style.display = 'none';
            document.getElementById('deleteMemberFilter').value = '';
            document.getElementById('deleteTypeFilter').value = '';
            document.getElementById('deleteDateFrom').value = '';
            document.getElementById('deleteDateTo').value = '';
        }

        // GitHub Token 狀態檢查功能
        async function checkTokenStatus() {
            const tokenStatus = document.getElementById('tokenStatus');
            const checkBtn = document.getElementById('checkTokenBtn');
            
            try {
                checkBtn.disabled = true;
                checkBtn.innerHTML = '🔍 檢查中...';
                
                const response = await fetch(ENV_CONFIG.getApiBase() + '/api/github/token/status');
                const result = await response.json();
                
                if (result.success) {
                    if (result.hasToken) {
                        tokenStatus.innerHTML = `
                            <div style="background: rgba(40, 167, 69, 0.2); color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                                <h5 style="margin: 0 0 10px 0;">✅ Token 狀態正常</h5>
                                <p style="margin: 5px 0;"><strong>Token:</strong> ${result.tokenPreview}</p>
                                <p style="margin: 5px 0;"><strong>來源:</strong> ${result.tokenSource}</p>
                                <p style="margin: 5px 0; font-size: 0.9em; opacity: 0.8;">${result.message}</p>
                            </div>
                        `;
                    } else {
                        tokenStatus.innerHTML = `
                            <div style="background: rgba(255, 193, 7, 0.2); color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                                <h5 style="margin: 0 0 10px 0;">⚠️ Token 未設置</h5>
                                <p style="margin: 5px 0;">${result.message}</p>
                                <p style="margin: 5px 0; font-size: 0.9em;">請在 Render Dashboard 中設置 GITHUB_TOKEN 環境變數</p>
                            </div>
                        `;
                    }
                } else {
                    tokenStatus.innerHTML = `
                        <div style="background: rgba(220, 53, 69, 0.2); color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                            <h5 style="margin: 0 0 10px 0;">❌ Token 檢查失敗</h5>
                            <p style="margin: 5px 0;">${result.message}</p>
                        </div>
                    `;
                }
            } catch (error) {
                tokenStatus.innerHTML = `
                    <div style="background: rgba(220, 53, 69, 0.2); color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <h5 style="margin: 0 0 10px 0;">❌ Token 檢查錯誤</h5>
                        <p style="margin: 5px 0;">${error.message}</p>
                    </div>
                `;
            } finally {
                checkBtn.disabled = false;
                checkBtn.innerHTML = '🔍 檢查 Token 狀態';
            }
        }
        

        // GitHub 同步功能
        async function syncToGitHub() {
            const syncBtn = document.getElementById('syncBtn');
            const syncStatus = document.getElementById('syncStatus');
            
            try {
                // 顯示載入狀態
                syncBtn.disabled = true;
                syncBtn.innerHTML = '🔄 同步中...';
                syncStatus.style.display = 'block';
                syncStatus.className = 'sync-status loading';
                syncStatus.innerHTML = '正在同步資料到 GitHub...';
                
                console.log('🔄 開始同步資料到 GitHub...');
                
                // 呼叫後端 API
                const response = await fetch(ENV_CONFIG.getApiBase() + '/api/github/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // 成功
                    syncStatus.className = 'sync-status success';
                    syncStatus.innerHTML = `✅ ${result.message}`;
                    console.log('✅ 同步成功:', result);
                } else {
                    // 失敗
                    syncStatus.className = 'sync-status error';
                    syncStatus.innerHTML = `❌ 同步失敗: ${result.message}`;
                    console.error('❌ 同步失敗:', result);
                }
                
            } catch (error) {
                // 錯誤處理
                syncStatus.className = 'sync-status error';
                syncStatus.innerHTML = `❌ 同步失敗: ${error.message}`;
                console.error('❌ 同步錯誤:', error);
            } finally {
                // 恢復按鈕狀態
                syncBtn.disabled = false;
                syncBtn.innerHTML = '💾 儲存到 GitHub';
                
                // 3秒後隱藏狀態訊息
                setTimeout(() => {
                    syncStatus.style.display = 'none';
                }, 3000);
            }
        }

        // 清空所有數據
        async function clearAllData() {
            if (records.length === 0) {
                alert('沒有數據可以清空！');
                return;
            }

            const confirmMessage = `⚠️ 警告：您即將清空所有 ${records.length} 筆記錄！\n\n此操作將：\n- 刪除JSON文件中的所有記錄\n- 清空統計數據\n- 無法復原\n\n確定要繼續嗎？`;
            
            if (confirm(confirmMessage)) {
                const doubleConfirm = confirm('最後確認：您真的要清空所有數據嗎？\n\n請輸入 "YES" 來確認（請手動輸入 YES）');
                
                if (doubleConfirm) {
                    const userInput = prompt('請輸入 "YES" 來確認清空所有數據：');
                    
                    if (userInput === 'YES') {
                        try {
                            console.log('🗑️ 開始清除JSON文件中的所有數據...');
                            console.log('🔗 清除API URL:', ENV_CONFIG.getApiBase() + '/api/records/clear');
                            
                            // 使用JSON文件清除API
                            const clearResponse = await fetch(ENV_CONFIG.getApiBase() + '/api/records/clear', {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            });
                            
                            console.log('📡 清除API回應狀態:', clearResponse.status);
                            console.log('📡 清除API回應OK:', clearResponse.ok);
                            
                            const clearResult = await clearResponse.json();
                            console.log('📡 清除API回應內容:', clearResult);
                            
                            if (clearResult.success) {
                                console.log('✅ JSON文件已清空:', clearResult.message);
                                
                                // 清除前端數據
                                records = [];
                                // localStorage清除已移除
                                
                                // 清除後不需要重新載入數據，因為已經清空了
                                console.log('✅ 數據已清空，不需要重新載入');
                                
                                // 更新所有顯示
                                updateStats();
                                updateRecentRecords();
                                updateAllRecords();
                                updateCalendar();
                                // updateDataStats(); // 已移除，避免覆蓋月份篩選統計
                                updateMemberStats();
                        
                                alert(`✅ 所有數據已成功清空！\n\n清除了 ${clearResult.changes} 筆記錄`);
                            } else {
                                console.error('❌ JSON文件清除失敗:', clearResult.message);
                                alert('❌ 文件清除失敗：' + clearResult.message);
                            }
                            
                            console.log('✅ 清除數據完成');
                        } catch (error) {
                            console.error('❌ 清除數據時發生錯誤:', error);
                            alert('❌ 清除數據時發生錯誤：' + error.message);
                        }
                    } else {
                        alert('操作已取消。');
                    }
                }
            }
        }

        // 備份數據
        function backupData() {
            if (records.length === 0) {
                alert('沒有數據可以備份！');
                return;
            }

            dataBackup = JSON.parse(JSON.stringify(records));
            const backupData = {
                timestamp: new Date().toISOString(),
                records: dataBackup,
                count: records.length
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `family_records_backup_${formatDateToYYYYMMDD(new Date())}.json`;
            link.click();
            URL.revokeObjectURL(url);

            alert(`數據備份完成！\n備份了 ${records.length} 筆記錄。`);
        }

        // 還原數據
        function restoreData() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = function(event) {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const backupData = JSON.parse(e.target.result);
                        
                        if (!backupData.records || !Array.isArray(backupData.records)) {
                            alert('無效的備份檔案格式！');
                            return;
                        }

                        const confirmMessage = `找到備份數據：\n- 備份時間：${backupData.timestamp}\n- 記錄數量：${backupData.count}\n\n確定要還原這些數據嗎？\n（當前數據將被覆蓋）`;
                        
                        if (confirm(confirmMessage)) {
                            records = backupData.records;
                            // saveRecords() 已移除 - 數據直接保存到JSON文件
                            updateStats();
                            updateRecentRecords();
                            updateAllRecords();
                            updateCalendar(); // 確保日曆更新
                            // updateDataStats(); // 已移除，避免覆蓋月份篩選統計
                            
                            alert(`數據還原完成！\n還原了 ${records.length} 筆記錄。`);
                        }
                    } catch (error) {
                        alert('讀取備份檔案時發生錯誤：' + error.message);
                    }
                };
                reader.readAsText(file);
            };
            
            input.click();
        }

        // ==================== 圖表相關函數 ====================

        // 初始化所有圖表
        function initializeCharts() {
            console.log('初始化圖表...');
            console.log('當前記錄數量:', records.length);
            console.log('記錄內容:', records);
            
            // 檢查 Chart.js 是否載入
            if (typeof Chart === 'undefined') {
                console.error('Chart.js 未載入');
                showErrorMessage('圖表庫載入失敗，請重新整理頁面');
                return;
            }
            
            setCurrentMonth();
            
            // 檢查是否有數據
            if (records.length === 0) {
                console.log('沒有記錄數據，顯示提示信息');
                showNoDataMessage();
                return;
            }
            
            updateCharts();
        }

        // 顯示錯誤信息
        function showErrorMessage(message) {
            const chartSections = document.querySelectorAll('.chart-section');
            chartSections.forEach(section => {
                const canvas = section.querySelector('canvas');
                if (canvas) {
                    const container = canvas.parentElement;
                    container.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #e53e3e;">
                            <h4>❌ 圖表載入失敗</h4>
                            <p>${message}</p>
                            <button class="btn" onclick="location.reload()" style="margin-top: 15px;">
                                重新整理頁面
                            </button>
                        </div>
                    `;
                }
            });
        }

        // 顯示無數據提示
        function showNoDataMessage() {
            const chartSections = document.querySelectorAll('.chart-section');
            chartSections.forEach(section => {
                const canvas = section.querySelector('canvas');
                if (canvas) {
                    const container = canvas.parentElement;
                    container.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #666;">
                            <h4>📊 暫無數據</h4>
                            <p>請先新增一些收支記錄，然後再查看圖表</p>
                            <button class="btn" onclick="showTab('add')" style="margin-top: 15px;">
                                前往新增記錄
                            </button>
                        </div>
                    `;
                }
            });
        }

        // 設置當前月份為默認選中
        function setCurrentMonth() {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1; // getMonth() 返回 0-11
            const monthSelect = document.getElementById('chartMonth');
            if (monthSelect) {
                monthSelect.value = currentMonth;
            }
        }

        // 更新所有圖表
        function updateCharts() {
            const year = parseInt(document.getElementById('chartYear').value);
            const month = parseInt(document.getElementById('chartMonth').value);
            
            console.log('更新圖表:', { year, month });
            
            updateTrendChart(year, month);
            updateCategoryChart(year, month);
            updateMemberChart(year, month);
        }

        // 重新整理圖表
        function refreshCharts() {
            if (trendChart) trendChart.destroy();
            if (categoryChart) categoryChart.destroy();
            if (memberChart) memberChart.destroy();
            
            updateCharts();
        }

        // 獲取指定月份的數據
        function getDataByMonth(year, month) {
            const filteredRecords = records.filter(record => {
                const recordDate = new Date(record.date);
                const recordYear = recordDate.getFullYear();
                const recordMonth = recordDate.getMonth() + 1; // getMonth() 返回 0-11，需要 +1
                
                return recordYear === year && recordMonth === month;
            });
            
            return filteredRecords;
        }

        // 更新收支趨勢圖表
        function updateTrendChart(year, month) {
            console.log('更新收支趨勢圖表:', { year, month });
            
            const ctx = document.getElementById('trendChart');
            if (!ctx) {
                console.error('找不到 trendChart canvas 元素');
                return;
            }
            
            if (trendChart) {
                trendChart.destroy();
            }
            
            const data = getDataByMonth(year, month);
            console.log('趨勢圖表數據:', data);
            
            const chartData = processDailyTrendData(data, year, month);
            console.log('處理後的趨勢圖表數據:', chartData);
            
            trendChart = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [
                        {
                            label: '收入',
                            data: chartData.income,
                            borderColor: '#51cf66',
                            backgroundColor: 'rgba(81, 207, 102, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: '支出',
                            data: chartData.expense,
                            borderColor: '#ff6b6b',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `${year}年${month}月 每日收支趨勢`
                        },
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }


        // 更新類別統計圖表
        function updateCategoryChart(year, month) {
            console.log('更新類別統計圖表:', { year, month });
            
            const ctx = document.getElementById('categoryChart');
            if (!ctx) {
                console.error('找不到 categoryChart canvas 元素');
                return;
            }
            
            if (categoryChart) {
                categoryChart.destroy();
            }
            
            const data = getDataByMonth(year, month);
            console.log('類別圖表數據:', data);
            
            const chartData = processCategoryData(data);
            console.log('處理後的類別圖表數據:', chartData);
            
            categoryChart = new Chart(ctx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        data: chartData.values,
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                            '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `${year}年${month}月 支出類別統計`
                        },
                        legend: {
                            position: 'right',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return context.label + ': $' + context.parsed.toLocaleString() + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        }

        // 更新成員收支對比圖表
        function updateMemberChart(year, month) {
            console.log('更新成員收支對比圖表:', { year, month });
            
            const ctx = document.getElementById('memberChart');
            if (!ctx) {
                console.error('找不到 memberChart canvas 元素');
                return;
            }
            
            if (memberChart) {
                memberChart.destroy();
            }
            
            const data = getDataByMonth(year, month);
            console.log('成員圖表數據:', data);
            
            const chartData = processMemberData(data);
            console.log('處理後的成員圖表數據:', chartData);
            
            memberChart = new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: chartData.labels,
                    datasets: [
                        {
                            label: '收入',
                            data: chartData.income,
                            backgroundColor: 'rgba(81, 207, 102, 0.8)',
                            borderColor: '#51cf66',
                            borderWidth: 1
                        },
                        {
                            label: '支出',
                            data: chartData.expense,
                            backgroundColor: 'rgba(255, 107, 107, 0.8)',
                            borderColor: '#ff6b6b',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `${year}年${month}月 成員收支對比`
                        },
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }

        // 處理每日趨勢數據
        function processDailyTrendData(data, year, month) {
            const groupedData = {};
            
            // 獲取該月的天數
            const daysInMonth = new Date(year, month, 0).getDate();
            
            // 初始化所有天數
            for (let day = 1; day <= daysInMonth; day++) {
                const dayKey = String(day).padStart(2, '0');
                groupedData[dayKey] = { income: 0, expense: 0 };
            }
            
            // 處理實際數據
            data.forEach(record => {
                const date = new Date(record.date);
                const day = String(date.getDate()).padStart(2, '0');
                
                if (record.type === 'income') {
                    groupedData[day].income += record.amount;
                } else {
                    groupedData[day].expense += record.amount;
                }
            });
            
            const labels = Object.keys(groupedData).sort((a, b) => parseInt(a) - parseInt(b));
            const income = labels.map(day => groupedData[day].income);
            const expense = labels.map(day => groupedData[day].expense);
            
            return { labels, income, expense };
        }


        // 處理類別數據
        function processCategoryData(data) {
            const categoryTotals = {};
            
            data.filter(record => record.type === 'expense').forEach(record => {
                const category = record.mainCategory;
                if (!categoryTotals[category]) {
                    categoryTotals[category] = 0;
                }
                categoryTotals[category] += record.amount;
            });
            
            // 按金額排序
            const sortedCategories = Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10); // 只顯示前10個類別
            
            const labels = sortedCategories.map(([category]) => category);
            const values = sortedCategories.map(([, amount]) => amount);
            
            return { labels, values };
        }

        // 處理成員數據
        function processMemberData(data) {
            const memberTotals = {};
            
            data.forEach(record => {
                const member = record.member;
                
                if (!memberTotals[member]) {
                    memberTotals[member] = { income: 0, expense: 0 };
                }
                
                if (record.type === 'income') {
                    memberTotals[member].income += record.amount;
                } else {
                    memberTotals[member].expense += record.amount;
                }
            });
            
            // 按照指定順序排列：Kelvin、Phuong、Ryan、家用
            const orderedMembers = ['Kelvin', 'Phuong', 'Ryan', '家用'];
            const labels = orderedMembers.filter(member => memberTotals[member]);
            const income = labels.map(member => memberTotals[member].income);
            const expense = labels.map(member => memberTotals[member].expense);
            
            return { labels, income, expense };
        }

        // 統一的日期格式化函數，避免時區問題
        function formatDateToYYYYMMDD(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // 將斜線日期格式轉換為標準格式
        function convertDateToStandard(dateStr) {
            if (!dateStr) return dateStr;
            // 將 2025/9/21 轉換為 2025-09-21
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const year = parts[0];
                const month = parts[1].padStart(2, '0');
                const day = parts[2].padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            return dateStr;
        }

        // 日曆功能
        function updateCalendar() {
            const calendarTitle = document.getElementById('calendarTitle');
            const calendarGrid = document.getElementById('calendarGrid');
            
            if (!calendarTitle || !calendarGrid) {
                console.log('⚠️ 日曆元素不存在，跳過日曆更新');
                return;
            }
            
            calendarTitle.textContent = `${currentYear}年${currentMonth + 1}月`;
            
            // 清空日曆（不包含星期標題，因為HTML中已經有了）
            calendarGrid.innerHTML = '';
            
            // 獲取當月第一天和最後一天
            const firstDay = new Date(currentYear, currentMonth, 1);
            const lastDay = new Date(currentYear, currentMonth + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            // 生成42天（6週）
            for (let i = 0; i < 42; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                
                if (date.getMonth() !== currentMonth) {
                    dayElement.classList.add('other-month');
                }
                
                if (date.toDateString() === new Date().toDateString()) {
                    dayElement.classList.add('today');
                }
                
                const dateStr = formatDateToYYYYMMDD(date);
                dayElement.innerHTML = `
                    <div class="day-number">${date.getDate()}</div>
                    <div class="day-records" id="day-records-${dateStr}"></div>
                `;
                dayElement.id = `day-${dateStr}`;
                
                dayElement.onclick = () => showDayRecords(date);
                calendarGrid.appendChild(dayElement);
            }
            
            // 更新每日記錄
            updateDayRecords();
        }

        function updateDayRecords() {
            console.log('📅 updateDayRecords: 開始更新日曆記錄');
            console.log('📅 當前records數量:', records.length);
            
            // 先清空所有日期的記錄
            document.querySelectorAll('.day-records').forEach(element => {
                element.innerHTML = '';
            });
            
            // 按日期和成員分組計算總額
            const dayMemberTotals = {};
            records.forEach(record => {
                const date = convertDateToStandard(record.date); // 轉換日期格式
                const member = record.member;
                const amount = record.type === 'income' ? record.amount : -record.amount;
                
                if (!dayMemberTotals[date]) {
                    dayMemberTotals[date] = {};
                }
                if (!dayMemberTotals[date][member]) {
                    dayMemberTotals[date][member] = 0;
                }
                dayMemberTotals[date][member] += amount;
            });
            
            // 顯示每個成員的當日總額
            Object.keys(dayMemberTotals).forEach(date => {
                const dayRecordsElement = document.getElementById(`day-records-${date}`);
                if (dayRecordsElement) {
                    const memberTotals = dayMemberTotals[date];
                    Object.keys(memberTotals).forEach(member => {
                        const total = memberTotals[member];
                        if (total !== 0) {
                            const recordClass = total > 0 ? 'day-income' : 'day-expense';
                            const prefix = total > 0 ? '+' : '';
                            
                            const recordDiv = document.createElement('div');
                            recordDiv.className = recordClass;
                            recordDiv.textContent = `${member}: ${prefix}$${Math.abs(total).toLocaleString()}`;
                            dayRecordsElement.appendChild(recordDiv);
                        }
                    });
                    
                    // 如果有記錄，添加has-records類
                    if (dayRecordsElement.children.length > 0) {
                        const dayElement = dayRecordsElement.closest('.calendar-day');
                        if (dayElement) {
                            dayElement.classList.add('has-records');
                        }
                    }
                }
            });
        }

        function changeMonth(direction) {
            currentMonth += direction;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            } else if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            updateCalendar();
        }

        function showDayRecords(date) {
            const standardDate = formatDateToYYYYMMDD(date);
            const dayRecords = records.filter(record => convertDateToStandard(record.date) === standardDate);
            
            if (dayRecords.length === 0) {
                // 不顯示提醒，直接返回
                return;
            }
            
            let message = `${date.toLocaleDateString('zh-TW')} 的記錄：\n\n`;
            dayRecords.forEach(record => {
                const prefix = record.type === 'income' ? '+' : '-';
                const categoryText = record.subCategory ? `${record.mainCategory} - ${record.subCategory}` : record.mainCategory;
                message += `${record.member} - ${categoryText}: ${prefix}$${record.amount}\n`;
                if (record.description) {
                    message += `  描述: ${record.description}\n`;
                }
                message += '\n';
            });
            
            alert(message);
        }

