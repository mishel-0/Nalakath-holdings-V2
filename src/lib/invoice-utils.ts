/**
 * NALAKATH CONSTRUCTIONS — INVOICE UTILS
 * Ported from strict Python fiscal model for parity.
 */

/**
 * Format number in Indian style: 82,80,370.00
 */
export function fmt(n: number | string): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "0.00";
  
  const rounded = Math.round(num * 100) / 100;
  const parts = rounded.toFixed(2).split(".");
  const dec = parts[1];
  let i = Math.floor(Math.abs(rounded));
  
  if (i < 1000) {
    return `${i}.${dec}`;
  } else if (i < 100000) {
    const thousand = Math.floor(i / 1000);
    const rem = i % 1000;
    return `${thousand},${rem.toString().padStart(3, '0')}.${dec}`;
  } else {
    const rem = i % 100000;
    const lakhTotal = Math.floor(i / 100000);
    const remFormatted = `${Math.floor(rem / 1000).toString().padStart(2, '0')},${(rem % 1000).toString().padStart(3, '0')}`;
    
    if (lakhTotal < 100) {
      return `${lakhTotal},${remFormatted}.${dec}`;
    }
    
    const cr = Math.floor(lakhTotal / 100);
    const lakhRem = lakhTotal % 100;
    return `${cr},${lakhRem.toString().padStart(2, '0')},${remFormatted}.${dec}`;
  }
}

/**
 * Convert rupee amount to Indian English words
 */
export function toWords(n: number | string): string {
  const num = Math.round(Number(n));
  if (num === 0) return "Zero";
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function b100(x: number): string {
    if (x < 20) return ones[x];
    return tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '');
  }

  function b1000(x: number): string {
    if (x < 100) return b100(x);
    return ones[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' and ' + b100(x % 100) : '');
  }

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;

  let result = '';
  if (crore > 0) result += b1000(crore) + ' Crore ';
  if (lakh > 0) result += b1000(lakh) + ' Lakh ';
  if (thousand > 0) result += b1000(thousand) + ' Thousand ';
  if (rest > 0) result += b1000(rest);

  return result.trim().toUpperCase() + " ONLY";
}

/**
 * Calculate totals based on Python model
 */
export function calculateInvoiceTotals(items: any[], discountPercent: number, tdsPercent: number, isCgstSgst: boolean, extraCharges: number) {
  const subtotal = items.reduce((acc, item) => acc + (Number(item.qty) * Number(item.rate) || 0), 0);
  const discAmt = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const net = subtotal - discAmt;

  let cgst = 0, sgst = 0, igst = 0;
  
  items.forEach(item => {
    const base = Math.round(Number(item.qty) * Number(item.rate) * (1 - discountPercent / 100) * 100) / 100;
    const g = Math.round(base * (Number(item.gst) / 100) * 100) / 100;
    
    if (isCgstSgst) {
      cgst += Math.round((g / 2) * 100) / 100;
      sgst += Math.round((g / 2) * 100) / 100;
    } else {
      igst += g;
    }
  });

  cgst = Math.round(cgst * 100) / 100;
  sgst = Math.round(sgst * 100) / 100;
  igst = Math.round(igst * 100) / 100;
  
  const totalGst = cgst + sgst + igst;
  const preTds = net + totalGst + extraCharges;
  const tdsAmt = Math.round(net * (tdsPercent / 100) * 100) / 100;
  const final = Math.round((preTds - tdsAmt) * 100) / 100;

  return {
    subtotal,
    discAmt,
    net,
    cgst,
    sgst,
    igst,
    totalGst,
    tdsAmt,
    final
  };
}
