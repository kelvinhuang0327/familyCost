const fs = require('fs');

// 讀取數據
const data = JSON.parse(fs.readFileSync('data/data.json', 'utf8'));
const records = data.records;

console.log('📊 現金支出分析:');
console.log('總記錄數:', records.length);

// 現金支出記錄
const cashExpenseRecords = records.filter(record => 
  record.type === 'expense' && record.subCategory === '現金'
);

console.log('現金支出記錄數:', cashExpenseRecords.length);
console.log('現金支出總額:', cashExpenseRecords.reduce((sum, record) => sum + record.amount, 0));

// 現金收入記錄
const cashIncomeRecords = records.filter(record => 
  record.type === 'income' && record.subCategory === '現金'
);

console.log('現金收入記錄數:', cashIncomeRecords.length);
console.log('現金收入總額:', cashIncomeRecords.reduce((sum, record) => sum + record.amount, 0));

// 現金餘額
const cashBalance = cashIncomeRecords.reduce((sum, record) => sum + record.amount, 0) - 
                   cashExpenseRecords.reduce((sum, record) => sum + record.amount, 0);

console.log('現金餘額:', cashBalance);

// 檢查前幾筆現金支出記錄
console.log('\n前5筆現金支出記錄:');
cashExpenseRecords.slice(0, 5).forEach((record, index) => {
  console.log(`${index + 1}. ${record.date} - ${record.member} - ${record.category} - ${record.subCategory} - $${record.amount}`);
});

// 檢查前幾筆現金收入記錄
console.log('\n前5筆現金收入記錄:');
cashIncomeRecords.slice(0, 5).forEach((record, index) => {
  console.log(`${index + 1}. ${record.date} - ${record.member} - ${record.category} - ${record.subCategory} - $${record.amount}`);
});

// 檢查是否有異常的現金收入記錄
console.log('\n檢查異常現金收入記錄:');
const largeCashIncome = cashIncomeRecords.filter(record => record.amount > 10000);
console.log('大額現金收入記錄:', largeCashIncome.length);
largeCashIncome.forEach(record => {
  console.log(`${record.date} - ${record.member} - ${record.category} - $${record.amount} - ${record.description}`);
});
