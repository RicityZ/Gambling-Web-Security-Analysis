# 📚 Documentation & Attack Demonstration

This folder contains comprehensive documentation of the security vulnerability analysis and penetration testing conducted on the gambling web application.

## 📄 Contents

### 1. **cyber2.pdf** - Full Security Analysis Report
Complete cybersecurity project report (รหัส 101203) detailing:
- Project background and objectives
- Attack methodology and tools used
- Vulnerability analysis and findings
- Security recommendations
- Ethical considerations

### 2. **Screenshots** - Visual Evidence
Screenshots demonstrating the vulnerability exploitation:
- `before-attack.png` - Normal game state
- `mitm-proxy-setup.png` - mitmproxy configuration
- `injected-win.png` - Successful injection showing manipulated winning (e.g., 9999 บาท)
- `balance-manipulation.png` - User balance after exploitation

### 3. **attack-demo/** - Step-by-Step Attack Guide

---

## 🎯 How the Attack Works

### Vulnerability: Client-Side Injection via MITM

The vulnerable version trusts the `totalWin` value sent from the client, allowing attackers to:

1. **Intercept Traffic** using mitmproxy
2. **Modify Request/Response** to inject arbitrary winning amounts
3. **Bypass Server Logic** since server accepts client-calculated values

### Attack Flow:

```
User Browser                mitmproxy               Vulnerable Server
     |                           |                          |
     |--- POST /spin ----------->|                          |
     |    {bet: 100,             |                          |
     |     totalWin: 50}         |                          |
     |                           |                          |
     |                    [INTERCEPT & MODIFY]              |
     |                           |                          |
     |                           |--- POST /spin --------->|
     |                           |    {bet: 100,           |
     |                           |     totalWin: 9999} ✅  |
     |                           |                         |
     |                           |<-- Response ------------|
     |                           |    {balance: 19899,     |
     |                           |     totalWin: 9999}     |
     |                           |                         |
     |<-- Modified Response -----|                         |
     |    {balance: 19899,       |                         |
     |     totalWin: 9999} ✅    |                         |
```

---

## 🔒 The Fix (Patched Version)

### Security Measures Implemented:

1. **Server-Authoritative Logic**
   - Server calculates all game outcomes
   - Client only displays server results

2. **Input Validation**
   ```javascript
   if (typeof bet !== 'number' || bet < 1 || bet > 1000) {
     return res.status(400).json({ error: 'Invalid bet' })
   }
   ```

3. **Balance Verification**
   ```javascript
   if (balance < bet) {
     return res.status(400).json({ error: 'Insufficient balance' })
   }
   ```

4. **Safe Accounting Flow**
   ```javascript
   balance -= bet          // Deduct first
   const win = calculateWin()
   balance += win          // Pay later
   ```

5. **Grid Validation**
   - Server validates grid structure
   - Server recalculates matches and scores

---

## 📊 Impact Assessment

| Metric | Vulnerable | Patched |
|--------|-----------|---------|
| Client-controlled wins | ✅ Yes | ❌ No |
| MITM manipulation | ✅ Possible | ❌ Impossible |
| Balance integrity | ⚠️ Compromised | ✅ Protected |
| Input validation | ❌ None | ✅ Strict |
| Audit logging | ❌ None | ✅ Full |

---

## 🎓 Educational Value

This project demonstrates:

### Technical Skills:
- Web application security analysis
- Man-in-the-Middle attack execution
- Server-side validation implementation
- Secure coding practices


