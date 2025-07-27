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
