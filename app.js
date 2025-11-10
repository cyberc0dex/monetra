// Bank configuration
const bankConfig = {
    bankA: { name: 'TAIB', color: '#00bcd4', elementId: 'balanceA' },
    bankB: { name: 'BIBD', color: '#9c27b0', elementId: 'balanceB' },
    bankC: { name: 'BAIDURI', color: '#34d399', elementId: 'balanceC' }
};

let balances = {
    bankA: 0,
    bankB: 0,
    bankC: 0
};

let currentEditingBank = null;

// Initialize app
function init() {
    loadBalances();
    updateUI();
}

// Load balances from localStorage
function loadBalances() {
    const saved = localStorage.getItem('bankBalances');
    if (saved) {
        balances = JSON.parse(saved);
    }
}

// Save balances to localStorage
function saveBalances() {
    localStorage.setItem('bankBalances', JSON.stringify(balances));
}

// Format currency
function formatCurrency(amount) {
    return `$ ${amount.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    })} BND`;
}

// Calculate total balance
function getTotalBalance() {
    return balances.bankA + balances.bankB + balances.bankC;
}

// Get contribution percentages
function getContributionPercentages() {
    const total = getTotalBalance();
    
    if (total === 0) {
        return { bankA: 33.33, bankB: 33.33, bankC: 33.34 };
    }
    
    return {
        bankA: balances.bankA > 0 ? (balances.bankA / total) * 100 : 0,
        bankB: balances.bankB > 0 ? (balances.bankB / total) * 100 : 0,
        bankC: balances.bankC > 0 ? (balances.bankC / total) * 100 : 0
    };
}

// Update all UI elements
function updateUI() {
    // Update total
    const total = getTotalBalance();
    document.getElementById('totalAmount').textContent = formatCurrency(total);
    
    // Update individual balances
    document.getElementById('balanceA').textContent = formatCurrency(balances.bankA);
    document.getElementById('balanceB').textContent = formatCurrency(balances.bankB);
    document.getElementById('balanceC').textContent = formatCurrency(balances.bankC);
    
    // Update contribution bar
    updateContributionBar();
}

// Update contribution bar
function updateContributionBar() {
    const percentages = getContributionPercentages();
    
    document.getElementById('segmentA').style.width = percentages.bankA + '%';
    document.getElementById('segmentA').style.backgroundColor = bankConfig.bankA.color;
    
    document.getElementById('segmentB').style.width = percentages.bankB + '%';
    document.getElementById('segmentB').style.backgroundColor = bankConfig.bankB.color;
    
    document.getElementById('segmentC').style.width = percentages.bankC + '%';
    document.getElementById('segmentC').style.backgroundColor = bankConfig.bankC.color;
}

// Open edit modal
function openEditModal(bankKey) {
    currentEditingBank = bankKey;
    const modal = document.getElementById('editModal');
    const title = document.getElementById('modalTitle');
    const input = document.getElementById('modalInput');
    
    title.textContent = bankConfig[bankKey].name;
    input.value = balances[bankKey];
    
    modal.classList.add('active');
    input.focus();
}

// Close modal
function closeModal() {
    const modal = document.getElementById('editModal');
    modal.classList.remove('active');
    currentEditingBank = null;
}

// Save balance
function saveBalance() {
    const input = document.getElementById('modalInput');
    const newBalance = parseFloat(input.value) || 0;
    
    balances[currentEditingBank] = newBalance;
    saveBalances();
    updateUI();
    closeModal();
}

// Handle Enter key in modal
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    const input = document.getElementById('modalInput');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveBalance();
        }
    });
});