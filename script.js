
      // User management system
        let currentUser = null;
        let users = JSON.parse(localStorage.getItem('cryptoUsers') || '{}');
        
        // Trading bot system
        let tradingBots = JSON.parse(localStorage.getItem('tradingBots') || '{}');
        let botIntervals = {};

        // Sample cryptocurrency data
        let cryptoData = [
            { name: 'Bitcoin', symbol: 'BTC', price: 43000, change: 2.5, marketCap: '840B', volume: '28.5B', icon: '₿', color: 'bg-orange-500' },
            { name: 'Ethereum', symbol: 'ETH', price: 2400, change: -1.2, marketCap: '290B', volume: '15.2B', icon: 'Ξ', color: 'bg-blue-600' },
            { name: 'Cardano', symbol: 'ADA', price: 0.45, change: 5.8, marketCap: '15.2B', volume: '1.8B', icon: '₳', color: 'bg-blue-500' },
            { name: 'Solana', symbol: 'SOL', price: 98.50, change: -3.1, marketCap: '42.8B', volume: '2.1B', icon: '◎', color: 'bg-purple-500' },
            { name: 'Polkadot', symbol: 'DOT', price: 7.25, change: 1.8, marketCap: '8.9B', volume: '580M', icon: '●', color: 'bg-pink-500' }
        ];

        // Wallet address for signup
        const USDT_TRC20_ADDRESS = 'TAwX8GBnWEpMrj4J9hLgPuQ2B4gJUxM7NS';

        // Authentication functions
        function showSignup() {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('signupForm').style.display = 'block';
            document.getElementById('authTitle').textContent = 'Create Your Account';
            // Generate QR code when signup form is shown
            generateQRCode(USDT_TRC20_ADDRESS);
        }

        function showLogin() {
            document.getElementById('signupForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('authTitle').textContent = 'Welcome Back';
        }

        function signup(name, email, password, initialDeposit) {
            if (users[email]) {
                alert('User already exists!');
                return false;
            }

            users[email] = {
                name: name,
                email: email,
                password: password,
                balance: parseFloat(initialDeposit),
                holdings: {},
                isAdmin: email === 'admin@cryptotrade.com',
                joinDate: new Date().toISOString()
            };

            localStorage.setItem('cryptoUsers', JSON.stringify(users));
            return true;
        }

        function login(email, password) {
            const user = users[email];
            if (user && user.password === password) {
                currentUser = user;
                return true;
            }
            return false;
        }

        function logout() {
            currentUser = null;
            document.getElementById('authModal').style.display = 'flex';
            document.getElementById('mainApp').style.display = 'none';
            // Hide admin buttons on logout
            document.getElementById('adminBtn').style.display = 'none';
            document.getElementById('adminBtnMobile').style.display = 'none';
        }

        function updateUserInterface() {
            if (!currentUser) return;

            document.getElementById('userGreeting').textContent = `Hello, ${currentUser.name}`;
            document.getElementById('userBalance').textContent = `$${currentUser.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
            // Show admin button if user is admin
            if (currentUser.isAdmin) {
                document.getElementById('adminBtn').style.display = 'block';
                document.getElementById('adminBtnMobile').style.display = 'block';
            } else {
                document.getElementById('adminBtn').style.display = 'none';
                document.getElementById('adminBtnMobile').style.display = 'none';
            }

            updatePortfolioView();
            updateBotInterface(); // Ensure bot interface is updated for current user
            updateAdminStats();
        }

        function updatePortfolioView() {
            const holdingsContainer = document.getElementById('userHoldings');
            const holdings = currentUser.holdings;
            
            if (Object.keys(holdings).length === 0) {
                holdingsContainer.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <p>No cryptocurrency holdings yet.</p>
                        <p class="text-sm mt-2">Start trading to build your portfolio!</p>
                    </div>
                `;
                document.getElementById('portfolioValue').textContent = `$${currentUser.balance.toFixed(2)}`;
                document.getElementById('portfolioChange').textContent = '+$0.00 (0.00%)';
                return;
            }

            let totalValue = currentUser.balance;
            let holdingsHTML = '';

            Object.keys(holdings).forEach(symbol => {
                const holding = holdings[symbol];
                const crypto = cryptoData.find(c => c.symbol === symbol);
                if (crypto) {
                    const currentValue = holding.amount * crypto.price;
                    const profitLoss = currentValue - holding.totalInvested;
                    const profitLossPercent = (profitLoss / holding.totalInvested) * 100;
                    totalValue += currentValue;

                    holdingsHTML += `
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div class="flex items-center">
                                <div class="w-8 h-8 ${crypto.color} rounded-full flex items-center justify-center text-white text-xs font-bold">${crypto.icon}</div>
                                <div class="ml-3">
                                    <div class="font-medium">${crypto.name}</div>
                                    <div class="text-sm text-gray-500">${holding.amount.toFixed(6)} ${symbol}</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="font-medium">$${currentValue.toFixed(2)}</div>
                                <div class="text-sm ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}">
                                    ${profitLoss >= 0 ? '+' : ''}$${profitLoss.toFixed(2)} (${profitLossPercent.toFixed(1)}%)
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            holdingsContainer.innerHTML = holdingsHTML;
            document.getElementById('portfolioValue').textContent = `$${totalValue.toFixed(2)}`;
            
            // Calculate overall change (simplified)
            // This calculation needs to consider the initial deposit and all subsequent deposits/withdrawals
            // For now, we'll use a simplified approach based on current balance and invested amount
            let totalInvestedInCrypto = 0;
            Object.values(holdings).forEach(h => {
                totalInvestedInCrypto += h.totalInvested;
            });

            // This is a very simplified P&L. A real system would track all transactions.
            // For the purpose of this simulation, we'll compare current total value to initial deposit + total invested in crypto
            // This is still not perfectly accurate for P&L but better reflects portfolio growth.
            const initialBalance = users[currentUser.email].initialDeposit || 0; // Assuming initialDeposit is stored
            const currentTotalAssets = totalValue; // Cash balance + crypto value

            // To calculate true P&L, we need to track all deposits and withdrawals.
            // For now, let's just show the change from the initial investment in crypto.
            // The portfolioValue already includes the cash balance.
            const totalPortfolioValue = currentUser.balance + Object.keys(holdings).reduce((sum, symbol) => {
                const holding = holdings[symbol];
                const crypto = cryptoData.find(c => c.symbol === symbol);
                return sum + (crypto ? holding.amount * crypto.price : 0);
            }, 0);

            // Calculate total invested in crypto (sum of all buy amounts)
            const totalCryptoInvestment = Object.values(holdings).reduce((sum, h) => sum + h.totalInvested, 0);
            
            // Calculate the value of crypto holdings at current prices
            const currentCryptoValue = Object.keys(holdings).reduce((sum, symbol) => {
                const holding = holdings[symbol];
                const crypto = cryptoData.find(c => c.symbol === symbol);
                return sum + (crypto ? holding.amount * crypto.price : 0);
            }, 0);

            // P&L from crypto holdings
            const cryptoPnL = currentCryptoValue - totalCryptoInvestment;

            // Total P&L (simplified: just crypto P&L for now, as cash balance doesn't have P&L)
            // A more robust system would track overall account P&L including deposits/withdrawals.
            const overallPnL = cryptoPnL; // For now, only crypto P&L

            const overallPnLPercent = totalCryptoInvestment > 0 ? (overallPnL / totalCryptoInvestment) * 100 : 0;

            document.getElementById('portfolioChange').innerHTML = `
                <span class="${overallPnL >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${overallPnL >= 0 ? '+' : ''}$${overallPnL.toFixed(2)} (${overallPnLPercent.toFixed(2)}%)
                </span>
            `;
            initPortfolioChart(); // Re-initialize chart to reflect updated data
        }

        function updateAdminStats() {
            if (currentUser && currentUser.isAdmin) {
                const totalUsers = Object.keys(users).length;
                const activeTraders = Object.values(users).filter(u => Object.keys(u.holdings).length > 0 || (tradingBots[u.email] && Object.keys(tradingBots[u.email]).length > 0)).length;
                
                document.getElementById('totalUsers').textContent = totalUsers;
                document.getElementById('activeTraders').textContent = activeTraders;
            }
        }

        // Trading functions
        let currentTrade = null;

        function openTradeModal(crypto, action) {
            currentTrade = { crypto, action };
            document.getElementById('tradeModal').style.display = 'flex';
            document.getElementById('tradeModalTitle').textContent = `${action} ${crypto.name}`;
            document.getElementById('tradePricePerUnit').textContent = `$${crypto.price.toLocaleString()}`;
            
            const confirmBtn = document.getElementById('confirmTradeBtn');
            confirmBtn.textContent = `Confirm ${action}`;
            confirmBtn.className = `flex-1 ${action === 'Buy' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white py-2 rounded-lg transition-colors`;
        }

        function calculateTradeAmount() {
            const amount = parseFloat(document.getElementById('tradeAmount').value) || 0;
            if (currentTrade && amount > 0) {
                const units = amount / currentTrade.crypto.price;
                document.getElementById('tradeReceiveAmount').textContent = `${units.toFixed(6)} ${currentTrade.crypto.symbol}`;
            } else {
                document.getElementById('tradeReceiveAmount').textContent = `0 ${currentTrade ? currentTrade.crypto.symbol : ''}`;
            }
        }

        function executeTrade() {
            const amount = parseFloat(document.getElementById('tradeAmount').value);
            if (!amount || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }

            if (currentTrade.action === 'Buy') {
                if (amount > currentUser.balance) {
                    alert('Insufficient balance');
                    return;
                }

                const units = amount / currentTrade.crypto.price;
                currentUser.balance -= amount;

                if (!currentUser.holdings[currentTrade.crypto.symbol]) {
                    currentUser.holdings[currentTrade.crypto.symbol] = {
                        amount: 0,
                        totalInvested: 0
                    };
                }

                currentUser.holdings[currentTrade.crypto.symbol].amount += units;
                currentUser.holdings[currentTrade.crypto.symbol].totalInvested += amount;

                alert(`Successfully bought ${units.toFixed(6)} ${currentTrade.crypto.symbol} for $${amount}`);
            } else if (currentTrade.action === 'Sell') {
                const holding = currentUser.holdings[currentTrade.crypto.symbol];
                if (!holding || holding.amount * currentTrade.crypto.price < amount) {
                    alert('Insufficient crypto holdings to sell this amount');
                    return;
                }

                const unitsToSell = amount / currentTrade.crypto.price;
                currentUser.balance += amount;
                currentUser.holdings[currentTrade.crypto.symbol].amount -= unitsToSell;

                // Adjust totalInvested for P&L calculation
                // This is a simplified adjustment. A more accurate method would track cost basis.
                const originalCostPerUnit = holding.totalInvested / holding.amount;
                currentUser.holdings[currentTrade.crypto.symbol].totalInvested -= (unitsToSell * originalCostPerUnit);

                // Remove holding if amount becomes zero or negative
                if (currentUser.holdings[currentTrade.crypto.symbol].amount <= 0.000001) { // Small epsilon for float comparison
                    delete currentUser.holdings[currentTrade.crypto.symbol];
                }

                alert(`Successfully sold ${unitsToSell.toFixed(6)} ${currentTrade.crypto.symbol} for $${amount}`);
            }

            // Save user data
            users[currentUser.email] = currentUser;
            localStorage.setItem('cryptoUsers', JSON.stringify(users));

            // Update UI
            updateUserInterface();
            closeTradeModal();
        }

        function closeTradeModal() {
            document.getElementById('tradeModal').style.display = 'none';
            document.getElementById('tradeAmount').value = '';
            currentTrade = null;
        }

        // Deposit functions
        function openDepositModal() {
            document.getElementById('depositModal').style.display = 'flex';
        }

        function executeDeposit() {
            const amount = parseFloat(document.getElementById('depositAmount').value);
            if (!amount || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }

            currentUser.balance += amount;
            users[currentUser.email] = currentUser;
            localStorage.setItem('cryptoUsers', JSON.stringify(users));

            updateUserInterface();
            closeDepositModal();
            alert(`Successfully deposited $${amount}`);
        }

        function closeDepositModal() {
            document.getElementById('depositModal').style.display = 'none';
            document.getElementById('depositAmount').value = '';
        }

        // Navigation functionality
        const navButtons = document.querySelectorAll('.nav-btn');
        const mobileNavButtons = document.querySelectorAll('.nav-btn-mobile');
        const views = ['marketView', 'portfolioView', 'autoTradeView', 'adminView'];

        function switchView(index) {
            // Update desktop nav buttons
            navButtons.forEach(b => {
                b.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                b.classList.add('text-gray-500');
            });
            if (navButtons[index]) {
                navButtons[index].classList.remove('text-gray-500');
                navButtons[index].classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
            }

            // Update mobile nav buttons
            mobileNavButtons.forEach(b => {
                b.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                b.classList.add('text-gray-500');
            });
            if (mobileNavButtons[index]) {
                mobileNavButtons[index].classList.remove('text-gray-500');
                mobileNavButtons[index].classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
            }

            // Show corresponding view
            views.forEach((view, i) => {
                const element = document.getElementById(view);
                if (element) {
                    element.style.display = i === index ? 'block' : 'none';
                }
            });
        }

        navButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => switchView(index));
        });

        mobileNavButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => switchView(index));
        });

        // Populate crypto table
        function populateCryptoTable() {
            const tableBody = document.getElementById('cryptoTable');
            tableBody.innerHTML = '';

            cryptoData.forEach(crypto => {
                const changeClass = crypto.change >= 0 ? 'text-green-600' : 'text-red-600';
                const changeSymbol = crypto.change >= 0 ? '+' : '';
                
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 transition-colors';
                row.innerHTML = `
                    <td class="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="w-6 h-6 lg:w-8 lg:h-8 ${crypto.color} rounded-full flex items-center justify-center text-white text-xs font-bold">${crypto.icon}</div>
                            <div class="ml-2 lg:ml-3">
                                <div class="text-xs lg:text-sm font-medium text-gray-900">${crypto.name}</div>
                                <div class="text-xs text-gray-500">${crypto.symbol}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm font-medium text-gray-900">$${crypto.price.toLocaleString()}</td>
                    <td class="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm ${changeClass}">${changeSymbol}${crypto.change.toFixed(2)}%</td>
                    <td class="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900 hidden sm:table-cell">$${crypto.marketCap}</td>
                    <td class="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900 hidden md:table-cell">$${crypto.volume}</td>
                    <td class="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm">
                        <div class="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                            <button onclick="openTradeModal(cryptoData.find(c => c.symbol === '${crypto.symbol}'), 'Buy')" class="bg-blue-600 text-white px-2 lg:px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-xs">Buy</button>
                            <button onclick="openTradeModal(cryptoData.find(c => c.symbol === '${crypto.symbol}'), 'Sell')" class="bg-gray-200 text-gray-700 px-2 lg:px-3 py-1 rounded-md hover:bg-gray-300 transition-colors text-xs">Sell</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        // Real-time price updates simulation
        function updatePrices() {
            cryptoData.forEach(crypto => {
                const changePercent = (Math.random() - 0.5) * 2; // Random change between -1% and +1%
                crypto.price = Math.max(0.01, crypto.price * (1 + changePercent / 100));
                crypto.change = crypto.change + (Math.random() - 0.5) * 0.5;
            });
            populateCryptoTable();
            if (currentUser) {
                updatePortfolioView();
                updateBotInterface(); // Update bot interface as prices change
            }
        }

        // Withdraw functions
        function openWithdrawModal() {
            document.getElementById('withdrawModal').style.display = 'flex';
            document.getElementById('availableBalance').textContent = `$${currentUser.balance.toFixed(2)}`;
        }

        function executeWithdraw() {
            const amount = parseFloat(document.getElementById('withdrawAmount').value);
            if (!amount || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }

            if (amount > currentUser.balance) {
                alert('Insufficient balance');
                return;
            }

            currentUser.balance -= amount;
            users[currentUser.email] = currentUser;
            localStorage.setItem('cryptoUsers', JSON.stringify(users));

            updateUserInterface();
            closeWithdrawModal();
            alert(`Successfully withdrew $${amount}`);
        }

        function closeWithdrawModal() {
            document.getElementById('withdrawModal').style.display = 'none';
            document.getElementById('withdrawAmount').value = '';
        }

        // Profile functions
        function openProfileModal() {
            document.getElementById('profileModal').style.display = 'flex';
            updateProfileData();
        }

        function closeProfileModal() {
            document.getElementById('profileModal').style.display = 'none';
        }

        function updateProfileData() {
            if (!currentUser) return;

            // Basic info
            document.getElementById('profileName').textContent = currentUser.name;
            document.getElementById('profileEmail').textContent = currentUser.email;
            document.getElementById('profileJoinDate').textContent = new Date(currentUser.joinDate).toLocaleDateString();
            document.getElementById('profileBalance').textContent = `$${currentUser.balance.toFixed(2)}`;

            // Calculate crypto assets value
            let cryptoValue = 0;
            Object.keys(currentUser.holdings).forEach(symbol => {
                const holding = currentUser.holdings[symbol];
                const crypto = cryptoData.find(c => c.symbol === symbol);
                if (crypto) {
                    cryptoValue += holding.amount * crypto.price;
                }
            });

            // Calculate bot assets value (Point 3)
            let botValue = 0;
            let totalPnL = 0;
            if (tradingBots[currentUser.email]) {
                Object.values(tradingBots[currentUser.email]).forEach(bot => {
                    // Bot value should be its current budget + value of its holdings
                    const crypto = cryptoData.find(c => c.symbol === bot.crypto);
                    const botHoldingValue = crypto ? bot.holdings * crypto.price : 0;
                    botValue += bot.budget + botHoldingValue; // Sum of cash in bot and value of crypto held by bot
                    totalPnL += bot.profit;
                });
            }

            const totalAssets = currentUser.balance + cryptoValue + botValue;

            document.getElementById('profileCryptoValue').textContent = `$${cryptoValue.toFixed(2)}`;
            document.getElementById('profileBotValue').textContent = `$${botValue.toFixed(2)}`; // Updated for Point 3
            document.getElementById('profileTotalPnL').textContent = `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`;
            document.getElementById('profileTotalPnL').className = `font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`;
            document.getElementById('profileTotalAssets').textContent = `$${totalAssets.toFixed(2)}`;

            // Update pie chart (Point 3)
            updateAssetDistributionChart(currentUser.balance, cryptoValue, botValue);
        }

        function updateAssetDistributionChart(balance, cryptoValue, botValue) {
            const ctx = document.getElementById('assetDistributionChart').getContext('2d');
            
            // Destroy existing chart if it exists
            if (window.assetChart) {
                window.assetChart.destroy();
            }

            const total = balance + cryptoValue + botValue;
            if (total === 0) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.font = '16px Inter';
                ctx.fillStyle = '#6b7280';
                ctx.textAlign = 'center';
                ctx.fillText('No assets to display', ctx.canvas.width / 2, ctx.canvas.height / 2);
                return;
            }

            window.assetChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Cash Balance', 'Crypto Assets', 'Trading Bots'],
                    datasets: [{
                        data: [balance, cryptoValue, botValue],
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        }

        // Admin User List Functions (New for Point 4)
        function openAdminUserListModal() {
            document.getElementById('adminUserListModal').style.display = 'flex';
            populateAdminUserList();
        }

        function closeAdminUserListModal() {
            document.getElementById('adminUserListModal').style.display = 'none';
        }

        function populateAdminUserList() {
            const tableBody = document.getElementById('adminUserListTableBody');
            tableBody.innerHTML = '';

            for (const email in users) {
                const user = users[email];
                // Skip admin user from being editable by themselves in this list
                if (user.isAdmin && user.email === currentUser.email) continue; 

                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${user.balance.toFixed(2)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="openEditUserBalanceModal('${user.email}')" class="text-blue-600 hover:text-blue-900">Edit Balance</button>
                    </td>
                `;
                tableBody.appendChild(row);
            }
        }

        let userToEditEmail = null;

        function openEditUserBalanceModal(email) {
            userToEditEmail = email;
            const user = users[email];
            document.getElementById('editUserEmail').value = user.email;
            document.getElementById('editCurrentBalance').value = `$${user.balance.toFixed(2)}`;
            document.getElementById('editNewBalance').value = user.balance;
            document.getElementById('editUserBalanceModal').style.display = 'flex';
        }

        function closeEditUserBalanceModal() {
            document.getElementById('editUserBalanceModal').style.display = 'none';
            userToEditEmail = null;
        }

        function confirmEditBalance() {
            if (!userToEditEmail) return;

            const newBalance = parseFloat(document.getElementById('editNewBalance').value);
            if (isNaN(newBalance) || newBalance < 0) {
                alert('Please enter a valid positive number for the new balance.');
                return;
            }

            users[userToEditEmail].balance = newBalance;
            localStorage.setItem('cryptoUsers', JSON.stringify(users));
            
            // If the edited user is the current user, update their UI
            if (userToEditEmail === currentUser.email) {
                currentUser.balance = newBalance; // Update current user object
                updateUserInterface();
            }

            populateAdminUserList(); // Refresh the user list
            closeEditUserBalanceModal();
            alert(`Balance for ${userToEditEmail} updated to $${newBalance.toFixed(2)}`);
        }

        // QR Code Generation Function
        function generateQRCode(text) {
            const qrcodeContainer = document.getElementById('qrcode');
            qrcodeContainer.innerHTML = ''; // Clear previous QR code
            new QRCode(qrcodeContainer, {
                text: text,
                width: 128,
                height: 128,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        }

        // Copy to Clipboard Function
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Address copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy address.');
            });
        }


        // Event listeners
        document.getElementById('showSignup').addEventListener('click', showSignup);
        document.getElementById('showLogin').addEventListener('click', showLogin);
        document.getElementById('logoutBtn').addEventListener('click', logout);
        document.getElementById('depositBtn').addEventListener('click', openDepositModal);
        document.getElementById('withdrawBtn').addEventListener('click', openWithdrawModal);
        document.getElementById('userProfileBtn').addEventListener('click', openProfileModal);
        document.getElementById('adminTotalUsersBtn').addEventListener('click', openAdminUserListModal); // New for Point 4
        document.getElementById('closeAdminUserListBtn').addEventListener('click', closeAdminUserListModal); // New for Point 4
        document.getElementById('cancelEditBalanceBtn').addEventListener('click', closeEditUserBalanceModal); // New for Point 4
        document.getElementById('confirmEditBalanceBtn').addEventListener('click', confirmEditBalance); // New for Point 4
        document.getElementById('copyAddressBtn').addEventListener('click', () => copyToClipboard(USDT_TRC20_ADDRESS)); // New for wallet address copy


        // Form submissions
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (login(email, password)) {
                document.getElementById('authModal').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                updateUserInterface();
                populateCryptoTable();
            } else {
                alert('Invalid credentials');
            }
        });

        document.getElementById('signupFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const initialDeposit = document.getElementById('initialDeposit').value;
            
            if (signup(name, email, password, initialDeposit)) {
                // Store initial deposit for later P&L calculation reference
                users[email].initialDeposit = parseFloat(initialDeposit);
                localStorage.setItem('cryptoUsers', JSON.stringify(users));

                if (login(email, password)) {
                    document.getElementById('authModal').style.display = 'none';
                    document.getElementById('mainApp').style.display = 'block';
                    updateUserInterface();
                    populateCryptoTable();
                }
            }
        });

        // Trade modal events
        document.getElementById('tradeAmount').addEventListener('input', calculateTradeAmount);
        document.getElementById('confirmTradeBtn').addEventListener('click', executeTrade);
        document.getElementById('cancelTradeBtn').addEventListener('click', closeTradeModal);

        // Deposit modal events
        document.getElementById('confirmDepositBtn').addEventListener('click', executeDeposit);
        document.getElementById('cancelDepositBtn').addEventListener('click', closeDepositModal);

        // Withdraw modal events
        document.getElementById('confirmWithdrawBtn').addEventListener('click', executeWithdraw);
        document.getElementById('cancelWithdrawBtn').addEventListener('click', closeWithdrawModal);

        // Profile modal events
        document.getElementById('closeProfileBtn').addEventListener('click', closeProfileModal);

        // Admin price update functionality
        document.getElementById('updatePricesBtn').addEventListener('click', () => {
            const btcPrice = parseFloat(document.getElementById('btcPrice').value);
            const ethPrice = parseFloat(document.getElementById('ethPrice').value);
            const adaPrice = parseFloat(document.getElementById('adaPrice').value);

            // Update the crypto data
            cryptoData[0].price = btcPrice; // Bitcoin
            cryptoData[1].price = ethPrice; // Ethereum
            cryptoData[2].price = adaPrice; // Cardano

            populateCryptoTable();
            if (currentUser) { // Ensure currentUser exists before updating views
                updatePortfolioView();
                updateBotInterface(); // Update bot interface as prices change
            }
            
            // Show success message
            const btn = document.getElementById('updatePricesBtn');
            const originalText = btn.textContent;
            btn.textContent = 'Updated!';
            btn.classList.add('bg-green-600');
            btn.classList.remove('bg-blue-600');
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('bg-green-600');
                btn.classList.add('bg-blue-600');
            }, 2000);
        });

        // Initialize portfolio chart
        function initPortfolioChart() {
            const ctx = document.getElementById('portfolioChart').getContext('2d');
            
            // Destroy existing chart if it exists
            if (window.portfolioChart) {
                window.portfolioChart.destroy();
            }

            // Generate realistic portfolio data based on current holdings
            const labels = [];
            const data = [];
            const now = new Date();
            
            // Create 7 data points for the last week
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                
                // Calculate portfolio value for this day (simulated)
                let portfolioValue = currentUser.balance;
                Object.keys(currentUser.holdings).forEach(symbol => {
                    const holding = currentUser.holdings[symbol];
                    const crypto = cryptoData.find(c => c.symbol === symbol);
                    if (crypto) {
                        // Simulate price variation over the week
                        const priceVariation = 1 + (Math.random() - 0.05); // Simulate a slight upward trend for demo
                        portfolioValue += holding.amount * crypto.price * priceVariation;
                    }
                });
                data.push(portfolioValue);
            }

            window.portfolioChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Portfolio Value',
                        data: data,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                },
                                font: {
                                    size: 10
                                }
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            });
        }

        // Trading Bot Functions
        function createTradingBot() {
            const name = document.getElementById('botName').value;
            const cryptoSymbol = document.getElementById('botCrypto').value;
            const strategy = document.getElementById('botStrategy').value;
            const budget = parseFloat(document.getElementById('botBudget').value);
            const buyThreshold = parseFloat(document.getElementById('buyThreshold').value) || -2;
            const sellThreshold = parseFloat(document.getElementById('sellThreshold').value) || 3;
            const maxTradeAmount = parseFloat(document.getElementById('maxTradeAmount').value) || 100;

            if (!name || isNaN(budget) || budget <= 0) {
                alert('Please fill all fields and ensure budget is a positive number.');
                return;
            }
            if (budget > currentUser.balance) {
                alert('Insufficient balance to allocate for this bot. Please deposit more funds or reduce bot budget.');
                return;
            }

            const botId = Date.now().toString();
            const bot = {
                id: botId,
                name: name,
                crypto: cryptoSymbol,
                strategy: strategy,
                budget: budget, // This is the cash allocated to the bot
                buyThreshold: buyThreshold,
                sellThreshold: sellThreshold,
                maxTradeAmount: maxTradeAmount,
                isActive: false,
                profit: 0, // P&L from bot trades
                trades: 0,
                lastPrice: cryptoData.find(c => c.symbol === cryptoSymbol).price, // Initial price for change calculation
                holdings: 0, // Crypto amount held by the bot
                createdAt: new Date().toISOString(),
                userId: currentUser.email
            };

            if (!tradingBots[currentUser.email]) {
                tradingBots[currentUser.email] = {};
            }
            tradingBots[currentUser.email][botId] = bot;

            // Deduct budget from user balance
            currentUser.balance -= budget;
            users[currentUser.email] = currentUser;

            localStorage.setItem('tradingBots', JSON.stringify(tradingBots));
            localStorage.setItem('cryptoUsers', JSON.stringify(users));

            updateUserInterface();
            updateBotInterface();
            clearBotForm();
            alert(`Bot "${name}" created successfully!`);
        }

        function clearBotForm() {
            document.getElementById('botName').value = '';
            document.getElementById('botBudget').value = '';
            document.getElementById('buyThreshold').value = '';
            document.getElementById('sellThreshold').value = '';
            document.getElementById('maxTradeAmount').value = '';
        }

        function updateBotInterface() {
            if (!currentUser) { // Ensure currentUser is set before trying to access its email
                document.getElementById('activeBots').textContent = 0;
                document.getElementById('botProfit').textContent = '$0.00';
                document.getElementById('totalTrades').textContent = 0;
                document.getElementById('botBalance').textContent = '$0.00';
                document.getElementById('botStatus').textContent = 'Inactive';
                document.getElementById('botStatusIndicator').className = 'w-3 h-3 rounded-full bg-red-500';
                displayBots(); // Display empty state
                return;
            }

            const userBots = tradingBots[currentUser.email] || {};
            const activeBotsCount = Object.values(userBots).filter(bot => bot.isActive).length;
            const totalProfit = Object.values(userBots).reduce((sum, bot) => sum + bot.profit, 0);
            const totalTrades = Object.values(userBots).reduce((sum, bot) => sum + bot.trades, 0);
            
            let totalBotAllocatedBalance = 0;
            Object.values(userBots).forEach(bot => {
                const crypto = cryptoData.find(c => c.symbol === bot.crypto);
                const botHoldingValue = crypto ? bot.holdings * crypto.price : 0;
                totalBotAllocatedBalance += bot.budget + botHoldingValue; // Sum of cash in bot and value of crypto held by bot
            });


            document.getElementById('activeBots').textContent = activeBotsCount;
            document.getElementById('botProfit').textContent = `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`;
            document.getElementById('totalTrades').textContent = totalTrades;
            document.getElementById('botBalance').textContent = `$${totalBotAllocatedBalance.toFixed(2)}`;
            document.getElementById('botStatus').textContent = activeBotsCount > 0 ? 'Active' : 'Inactive';
            
            const statusIndicator = document.getElementById('botStatusIndicator');
            statusIndicator.className = `w-3 h-3 rounded-full ${activeBotsCount > 0 ? 'bg-green-500' : 'bg-red-500'}`;

            displayBots();
        }

        function displayBots() {
            const container = document.getElementById('botsContainer');
            const userBots = tradingBots[currentUser.email] || {};

            if (Object.keys(userBots).length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <p class="text-lg font-medium">No trading bots created yet</p>
                        <p class="text-sm mt-2">Create your first bot to start automated trading</p>
                    </div>
                `;
                return;
            }

            let botsHTML = '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">';
            Object.values(userBots).forEach(bot => {
                const crypto = cryptoData.find(c => c.symbol === bot.crypto);
                const profitClass = bot.profit >= 0 ? 'text-green-600' : 'text-red-600';
                const botCurrentValue = bot.budget + (crypto ? bot.holdings * crypto.price : 0); // Current total value managed by bot
                
                botsHTML += `
                    <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h4 class="font-semibold text-gray-900">${bot.name}</h4>
                                <div class="text-sm text-gray-500">${crypto ? crypto.name : bot.crypto} • ${bot.strategy}</div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="px-2 py-1 text-xs rounded-full ${bot.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                    ${bot.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <button onclick="toggleBot('${bot.id}')" class="px-3 py-1 text-xs rounded ${bot.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-colors">
                                    ${bot.isActive ? 'Stop' : 'Start'}
                                </button>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div class="text-gray-600">Allocated Value</div>
                                <div class="font-medium">$${botCurrentValue.toFixed(2)}</div>
                            </div>
                            <div>
                                <div class="text-gray-600">Profit/Loss</div>
                                <div class="font-medium ${profitClass}">${bot.profit >= 0 ? '+' : ''}$${bot.profit.toFixed(2)}</div>
                            </div>
                            <div>
                                <div class="text-gray-600">Trades</div>
                                <div class="font-medium">${bot.trades}</div>
                            </div>
                            <div>
                                <div class="text-gray-600">Holdings</div>
                                <div class="font-medium">${bot.holdings.toFixed(6)} ${bot.crypto}</div>
                            </div>
                        </div>
                        <div class="mt-3 pt-3 border-t border-gray-200">
                            <div class="text-xs text-gray-500">
                                Buy: ${bot.buyThreshold}% | Sell: ${bot.sellThreshold}% | Max: $${bot.maxTradeAmount}
                            </div>
                        </div>
                    </div>
                `;
            });
            botsHTML += '</div>';
            container.innerHTML = botsHTML;
        }

        function toggleBot(botId) {
            const bot = tradingBots[currentUser.email][botId];
            bot.isActive = !bot.isActive;

            if (bot.isActive) {
                startBot(bot);
            } else {
                stopBot(botId);
            }

            localStorage.setItem('tradingBots', JSON.stringify(tradingBots));
            updateBotInterface();
        }

        function startBot(bot) {
            const crypto = cryptoData.find(c => c.symbol === bot.crypto);
            if (!crypto) {
                console.error(`Crypto data not found for symbol: ${bot.crypto}`);
                bot.isActive = false; // Deactivate bot if crypto data is missing
                return;
            }
            bot.lastPrice = crypto.price; // Set initial lastPrice

            // Clear any existing interval for this bot to prevent duplicates
            if (botIntervals[bot.id]) {
                clearInterval(botIntervals[bot.id]);
            }

            botIntervals[bot.id] = setInterval(() => {
                executeBotStrategy(bot);
            }, 5000); // Check every 5 seconds
            console.log(`Bot ${bot.name} (${bot.id}) started.`);
        }

        function stopBot(botId) {
            if (botIntervals[botId]) {
                clearInterval(botIntervals[botId]);
                delete botIntervals[botId];
                console.log(`Bot ${botId} stopped.`);
            }
        }

        function executeBotStrategy(bot) {
            const crypto = cryptoData.find(c => c.symbol === bot.crypto);
            if (!crypto) {
                console.error(`Crypto data not found for symbol: ${bot.crypto}. Stopping bot ${bot.name}.`);
                bot.isActive = false;
                stopBot(bot.id);
                localStorage.setItem('tradingBots', JSON.stringify(tradingBots));
                updateBotInterface();
                return;
            }

            const currentPrice = crypto.price;
            // Ensure lastPrice is initialized, especially if bot was just created or loaded
            if (bot.lastPrice === 0) {
                bot.lastPrice = currentPrice;
                return; // Skip first execution if lastPrice was zero
            }

            const priceChange = ((currentPrice - bot.lastPrice) / bot.lastPrice) * 100;

            // Simple strategy implementation
            // Buy condition: price drops by buyThreshold and bot has enough budget
            if (priceChange <= bot.buyThreshold && bot.budget >= bot.maxTradeAmount) {
                const tradeAmount = Math.min(bot.maxTradeAmount, bot.budget);
                const units = tradeAmount / currentPrice;
                
                bot.budget -= tradeAmount;
                bot.holdings += units;
                bot.trades++;
                
                // Update profit: if buying, profit doesn't change immediately, but cost basis is established.
                // For simplicity, we'll just track the P&L on the crypto held by the bot.
                // This is a very simplified P&L for the bot. A real bot would track cost basis for each trade.
                // For now, we'll just add a small simulated profit/loss on the trade itself.
                bot.profit += (Math.random() - 0.5) * (tradeAmount * 0.01); // Simulate +/- 1% profit/loss on trade amount

                bot.lastPrice = currentPrice; // Update last price after trade
                console.log(`Bot ${bot.name} bought ${units.toFixed(6)} ${bot.crypto} for $${tradeAmount.toFixed(2)}`);

                localStorage.setItem('tradingBots', JSON.stringify(tradingBots));
                updateBotInterface();
            } 
            // Sell condition: price rises by sellThreshold and bot has crypto holdings
            else if (priceChange >= bot.sellThreshold && bot.holdings > 0) {
                const unitsToSell = Math.min(bot.holdings, bot.maxTradeAmount / currentPrice);
                const tradeValue = unitsToSell * currentPrice;
                
                bot.holdings -= unitsToSell;
                bot.budget += tradeValue;
                bot.trades++;
                
                // Update profit: if selling, realize profit/loss.
                bot.profit += (Math.random() - 0.5) * (tradeValue * 0.01); // Simulate +/- 1% profit/loss on trade value

                bot.lastPrice = currentPrice; // Update last price after trade
                console.log(`Bot ${bot.name} sold ${unitsToSell.toFixed(6)} ${bot.crypto} for $${tradeValue.toFixed(2)}`);

                localStorage.setItem('tradingBots', JSON.stringify(tradingBots));
                updateBotInterface();
            }
            // If no trade, just update lastPrice to currentPrice to track change for next interval
            else {
                bot.lastPrice = currentPrice;
            }
        }

        function startAllBots() {
            const userBots = tradingBots[currentUser.email] || {};
            Object.values(userBots).forEach(bot => {
                if (!bot.isActive) {
                    bot.isActive = true;
                    startBot(bot);
                }
            });
            localStorage.setItem('tradingBots', JSON.stringify(tradingBots));
            updateBotInterface();
            alert('All active bots started!');
        }

        // Initialize portfolio chart when portfolio view is first shown
        document.getElementById('portfolioBtn').addEventListener('click', () => {
            // No need for setTimeout, initPortfolioChart is called in updatePortfolioView
            // which is called by updateUserInterface on view switch.
            // Ensure it's called when the view is actually displayed.
            // The `updateUserInterface` already calls `updatePortfolioView` which calls `initPortfolioChart`.
            // This listener is redundant if the chart needs to be redrawn specifically on this button click, keep it.
            // For now, let's rely on the `updateUserInterface` flow.
        });

        // Initialize bot interface when auto trade view is first shown
        document.getElementById('autoTradeBtn').addEventListener('click', () => {
            updateBotInterface();
        });

        // Bot event listeners
        document.getElementById('createBotBtn').addEventListener('click', createTradingBot);
        document.getElementById('startAllBotsBtn').addEventListener('click', startAllBots);

        // Start real-time updates every 3 seconds
        setInterval(updatePrices, 3000);

        // Create default admin user if doesn't exist
        if (!users['admin@cryptotrade.com']) {
            users['admin@cryptotrade.com'] = {
                name: 'Admin',
                email: 'admin@cryptotrade.com',
                password: 'admin123',
                balance: 100000,
                holdings: {},
                isAdmin: true,
                joinDate: new Date().toISOString(),
                initialDeposit: 100000 // Store initial deposit for admin too
            };
            localStorage.setItem('cryptoUsers', JSON.stringify(users));
        }

        // On page load, check if user is already logged in (e.g., from previous session)
        // This part needs to be careful not to auto-login if not intended.
        // For this simulation, we'll assume if localStorage has a 'currentUser' it's valid.
        // A real app would use session tokens.
        const storedUsers = JSON.parse(localStorage.getItem('cryptoUsers') || '{}');
        const lastLoggedInEmail = localStorage.getItem('lastLoggedInUserEmail'); // Assuming you store this

        if (lastLoggedInEmail && storedUsers[lastLoggedInEmail]) {
            currentUser = storedUsers[lastLoggedInEmail];
            document.getElementById('authModal').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            updateUserInterface();
            populateCryptoTable();
            // Restart any active bots for the current user
            if (tradingBots[currentUser.email]) {
                Object.values(tradingBots[currentUser.email]).forEach(bot => {
                    if (bot.isActive) {
                        startBot(bot);
                    }
                });
            }
        } else {
            // If no user is logged in, ensure the auth modal is visible
            document.getElementById('authModal').style.display = 'flex';
            document.getElementById('mainApp').style.display = 'none';
        }

        // Store last logged in user email (simplified for demo)
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (login(email, password)) {
                localStorage.setItem('lastLoggedInUserEmail', email); // Store email
                document.getElementById('authModal').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                updateUserInterface();
                populateCryptoTable();
                // Restart any active bots for the current user
                if (tradingBots[currentUser.email]) {
                    Object.values(tradingBots[currentUser.email]).forEach(bot => {
                        if (bot.isActive) {
                            startBot(bot);
                        }
                    });
                }
            } else {
                alert('Invalid credentials');
            }
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            // Stop all bots for the current user before logging out
            if (currentUser && tradingBots[currentUser.email]) {
                Object.values(tradingBots[currentUser.email]).forEach(bot => {
                    stopBot(bot.id);
                    bot.isActive = false; // Mark as inactive in storage
                });
                localStorage.setItem('tradingBots', JSON.stringify(tradingBots));
            }
            localStorage.removeItem('lastLoggedInUserEmail'); // Clear last logged in user
            logout();
        });