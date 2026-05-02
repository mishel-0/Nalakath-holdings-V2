#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════╗
║   NALAKATH CONSTRUCTIONS — INVOICE GENERATOR                ║
║   Run: python invoice_generator.py                          ║
║   Enter your invoice details when prompted → get PDF        ║
╚══════════════════════════════════════════════════════════════╝

Install dependencies first:
    pip install reportlab pillow
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image
import datetime
import os
import sys

# ── COLORS ──────────────────────────────────────────────────
DARK   = colors.HexColor('#0C0A07')
DARK2  = colors.HexColor('#181410')
GOLD   = colors.HexColor('#C9A84C')
GOLD2  = colors.HexColor('#DFC06A')
GOLD3  = colors.HexColor('#F0E4B8')
CREAM  = colors.HexColor('#F5EDD6')
LIGHT  = colors.HexColor('#FDFBF7')
MID    = colors.HexColor('#6B5C42')
BORDER = colors.HexColor('#CEBB8A')
BLIGHT = colors.HexColor('#E8D8A0')
RED    = colors.HexColor('#A02818')
WHITE  = colors.white
STRIPE = colors.HexColor('#F7F2E8')

W, H = A4


# ────────────────────────────────────────────────────────────
# UTILITIES
# ────────────────────────────────────────────────────────────

def fmt(n):
    """Format number in Indian style: 82,80,370.00"""
    n   = round(float(n), 2)
    dec = f"{n:.2f}".split(".")[1]
    i   = int(n)
    if i < 1000:
        return f"{i}.{dec}"
    elif i < 100000:
        return f"{i//1000},{i%1000:03d}.{dec}"
    else:
        rem  = i % 100000
        lakh = i // 100000
        if lakh < 100:
            return f"{lakh},{rem//1000:02d},{rem%1000:03d}.{dec}"
        cr     = lakh // 100
        lakh_r = lakh % 100
        return f"{cr},{lakh_r:02d},{rem//1000:02d},{rem%1000:03d}.{dec}"


def to_words(n):
    """Convert rupee amount to Indian English words"""
    n    = int(round(float(n)))
    if n == 0:
        return "Zero"
    ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
            'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
            'Seventeen','Eighteen','Nineteen']
    tens = ['','','Twenty','Thirty','Forty','Fifty',
            'Sixty','Seventy','Eighty','Ninety']

    def b100(x):
        if x < 20:
            return ones[x]
        return tens[x//10] + (' ' + ones[x%10] if x % 10 else '')

    def b1000(x):
        if x < 100:
            return b100(x)
        return ones[x//100] + ' Hundred' + (' and ' + b100(x%100) if x%100 else '')

    parts = []
    for val, label in [
        (n // 10000000, 'Crore'),
        (n % 10000000 // 100000, 'Lakh'),
        (n % 100000 // 1000, 'Thousand'),
        (n % 1000, None),
    ]:
        if val:
            parts.append(b1000(val) + (' ' + label if label else ''))
    return ' '.join(parts)


def ask(prompt, default=None, required=True):
    """Ask user for input with optional default value"""
    suffix = f" [{default}]" if default is not None else ""
    while True:
        val = input(f"  {prompt}{suffix}: ").strip()
        if val:
            return val
        if default is not None:
            return str(default)
        if not required:
            return ""
        print("  ⚠  Required — please enter a value.")


def ask_float(prompt, default=None):
    """Ask user for a float value"""
    suffix = f" [{default}]" if default is not None else ""
    while True:
        val = input(f"  {prompt}{suffix}: ").strip()
        if not val and default is not None:
            return float(default)
        try:
            return float(val)
        except ValueError:
            print("  ⚠  Please enter a valid number.")


def ask_int(prompt, default=None):
    """Ask user for an integer value"""
    suffix = f" [{default}]" if default is not None else ""
    while True:
        val = input(f"  {prompt}{suffix}: ").strip()
        if not val and default is not None:
            return int(default)
        try:
            return int(val)
        except ValueError:
            print("  ⚠  Please enter a whole number.")


def section(title):
    print(f"\n{'─'*52}")
    print(f"  {title}")
    print(f"{'─'*52}")


# ────────────────────────────────────────────────────────────
# INPUT COLLECTION
# ────────────────────────────────────────────────────────────

def collect_data():
    print("\n")
    print("╔══════════════════════════════════════════════════════╗")
    print("║    NALAKATH CONSTRUCTIONS — INVOICE GENERATOR       ║")
    print("╚══════════════════════════════════════════════════════╝")
    print("  Press Enter to accept default values shown in [brackets].\n")

    d = {}

    # ── INVOICE DETAILS ─────────────────────────────────────
    section("1 / 6  —  INVOICE DETAILS")
    d['inv_no']   = ask("Invoice Number", f"NC-{datetime.date.today().year}-0001")
    d['inv_date'] = ask("Invoice Date (DD-MM-YYYY)", datetime.date.today().strftime("%d-%m-%Y"))
    d['due_days'] = ask_int("Payment due in (days)", 30)
    d['terms']    = ask("Payment Terms", "Net 30 Days")
    d['proj_ref'] = ask("Project Reference", required=False)
    d['proj_desc']= ask("Project Description", required=False)

    try:
        p = d['inv_date'].split("-")
        d['inv_dt'] = datetime.date(int(p[2]), int(p[1]), int(p[0]))
    except Exception:
        d['inv_dt'] = datetime.date.today()
    d['due_dt'] = d['inv_dt'] + datetime.timedelta(days=d['due_days'])

    # ── SELLER ──────────────────────────────────────────────
    section("2 / 6  —  YOUR COMPANY  (Enter to use Nalakath defaults)")
    d['s_name']   = ask("Company Name",   "Nalakath Constructions Pvt. Ltd.")
    d['s_addr1']  = ask("Address Line 1", "Nalakath Hub, Ward No. 4, Areecode")
    d['s_addr2']  = ask("Address Line 2", "Malappuram, Kerala 673639")
    d['s_phone']  = ask("Phone",          "+91 97444 00100")
    d['s_email']  = ask("Email",          "info@nalakathindia.com")
    d['s_web']    = ask("Website",        "nalakathindia.com")
    d['s_gstin']  = ask("GSTIN",          "32XXXXXX1234Z5")
    d['s_cin']    = ask("CIN",            "U45200KL2013PTC034078")
    d['logo']     = ask("Logo file path (PNG)", required=False)

    # ── BUYER ────────────────────────────────────────────────
    section("3 / 6  —  BILL TO  (Client Details)")
    d['b_name']  = ask("Client / Company Name")
    d['b_attn']  = ask("Attention (Contact Person)", required=False)
    d['b_addr1'] = ask("Address Line 1")
    d['b_addr2'] = ask("Address Line 2", required=False)
    d['b_city']  = ask("City")
    d['b_state'] = ask("State", "Kerala")
    d['b_pin']   = ask("PIN Code")
    d['b_gstin'] = ask("GSTIN", required=False)
    d['b_po']    = ask("PO Reference", required=False)

    # ── BANK ─────────────────────────────────────────────────
    section("4 / 6  —  BANK DETAILS  (Enter to use defaults)")
    d['bk_name']  = ask("Bank Name",       "State Bank of India, Perinthalmanna")
    d['bk_acnm']  = ask("Account Name",    "Nalakath Constructions Pvt. Ltd.")
    d['bk_acno']  = ask("Account Number",  "32XXXXXXXXXX51")
    d['bk_ifsc']  = ask("IFSC Code",       "SBIN0001234")
    d['bk_type']  = ask("Account Type",    "Current Account")

    # ── LINE ITEMS ───────────────────────────────────────────
    section("5 / 6  —  LINE ITEMS")
    print("  Enter each item. Type  done  when finished.\n")

    items = []
    sno   = 1
    while True:
        print(f"  ── Item {sno} ──────────────────────────────────────")
        desc = input("  Description  (or 'done' to finish): ").strip()
        if desc.lower() == 'done':
            if not items:
                print("  ⚠  Add at least one item first.")
                continue
            break
        if not desc:
            continue

        hsn  = ask("  HSN / SAC Code", "9954")
        qty  = ask_float("  Quantity")
        unit = ask("  Unit  (Cu.m / Sq.m / Nos. / L.S.)", "Cu.m")
        rate = ask_float("  Rate per unit (Rs.)")
        gst  = ask_float("  GST %", 18)

        taxable = round(qty * rate, 2)
        gst_amt = round(taxable * gst / 100, 2)
        total   = round(taxable + gst_amt, 2)

        items.append({
            'sno': sno, 'desc': desc, 'hsn': hsn,
            'qty': qty, 'unit': unit, 'rate': rate,
            'gst': gst, 'taxable': taxable,
            'gst_amt': gst_amt, 'total': total,
        })
        print(f"\n  ✓  Taxable Rs. {fmt(taxable)}  +  GST Rs. {fmt(gst_amt)}  =  Rs. {fmt(total)}\n")
        sno += 1

    d['items'] = items

    # ── ADJUSTMENTS ─────────────────────────────────────────
    section("6 / 6  —  ADJUSTMENTS & OPTIONS")
    d['tds']      = ask_float("TDS %  (Sec. 194C, enter 0 to skip)", 2.0)
    d['disc']     = ask_float("Discount %  (enter 0 to skip)", 0.0)
    d['extra']    = ask_float("Additional charges Rs.  (enter 0 to skip)", 0.0)
    d['extra_lbl']= ""
    if d['extra'] > 0:
        d['extra_lbl'] = ask("Label for additional charges", "Additional Charges")

    gst_type   = ask("GST type — CGST+SGST (intra-state) or IGST (inter-state)?  C / I", "C")
    d['cgst']   = gst_type.upper() != 'I'
    d['notes']  = ask("Additional notes (optional)", required=False)
    d['jur']    = ask("Jurisdiction", "Malappuram")

    safe = d['inv_no'].replace('/', '-').replace(' ', '_')
    d['out'] = ask("Save PDF as", f"Invoice_{safe}.pdf")

    return d


# ────────────────────────────────────────────────────────────
# CALCULATE TOTALS
# ────────────────────────────────────────────────────────────

def calc(d):
    subtotal    = sum(i['taxable'] for i in d['items'])
    disc_amt    = round(subtotal * d['disc'] / 100, 2)
    net         = subtotal - disc_amt

    cgst = sgst = igst = 0.0
    for item in d['items']:
        base = round(item['qty'] * item['rate'] * (1 - d['disc']/100), 2)
        g    = round(base * item['gst'] / 100, 2)
        if d['cgst']:
            cgst += round(g/2, 2)
            sgst += round(g/2, 2)
        else:
            igst += g

    cgst       = round(cgst, 2)
    sgst       = round(sgst, 2)
    igst       = round(igst, 2)
    total_gst  = cgst + sgst + igst
    pre_tds    = net + total_gst + d['extra']
    tds_amt    = round(net * d['tds'] / 100, 2)
    final      = round(pre_tds - tds_amt, 2)

    return {
        'subtotal': subtotal, 'disc_amt': disc_amt, 'net': net,
        'cgst': cgst, 'sgst': sgst, 'igst': igst,
        'total_gst': total_gst, 'tds_amt': tds_amt, 'final': final,
    }


# ────────────────────────────────────────────────────────────
# PDF GENERATION
# ────────────────────────────────────────────────────────────

def make_pdf(d):
    totals = calc(d)
    c = canvas.Canvas(d['out'], pagesize=A4)
    c.setTitle(f"Nalakath Constructions — Invoice {d['inv_no']}")

    # ── HEADER ──────────────────────────────────────────────
    HDR = 108
    c.setFillColor(DARK)
    c.rect(0, H-HDR, W, HDR, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H-4, W, 4, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H-HDR-1, W, 2, fill=1, stroke=0)

    # Logo
    tx = 28
    logo = (d.get('logo') or '').strip()
    if logo and os.path.exists(logo):
        try:
            img    = Image.open(logo).convert('RGBA')
            iw, ih = img.size
            lh     = 82
            lw     = iw * (lh / ih)
            c.drawImage(ImageReader(img), 22, H-HDR+12, width=lw, height=lh, mask='auto')
            tx = 22 + lw + 16
        except Exception:
            pass

    # Company name
    c.setFillColor(GOLD)
    c.setFont('Helvetica-Bold', 20)
    c.drawString(tx, H-44, d['s_name'].upper())
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.6)
    c.line(tx, H-63, tx+300, H-63)
    c.setFillColor(GOLD3)
    c.setFont('Helvetica-Oblique', 8)
    c.drawString(tx, H-75, 'Building Trust. Building Kerala.')
    c.setFillColor(CREAM)
    c.setFont('Helvetica', 7.5)
    c.drawString(tx, H-90,  f"{d['s_addr1']}, {d['s_addr2']}")
    c.drawString(tx, H-101, f"{d['s_phone']}   |   {d['s_email']}   |   GSTIN: {d['s_gstin']}")

    # ── TITLE BAND ───────────────────────────────────────────
    BY = H-HDR-24
    c.setFillColor(GOLD)
    c.rect(0, BY, W, 23, fill=1, stroke=0)
    c.setFillColor(DARK)
    c.setFont('Helvetica-Bold', 14)
    c.drawString(28, BY+7, 'TAX INVOICE')
    c.setFont('Helvetica', 8)
    tax_lbl = 'CGST + SGST' if d['cgst'] else 'IGST'
    c.drawRightString(W-28, BY+7,
        f"Original for Recipient   |   {tax_lbl}   |   {d['jur']} Jurisdiction")

    # ── META BOXES ───────────────────────────────────────────
    MY = BY-12
    BH = 100

    def gold_box(x, y, w, h, title):
        # 1. Full box background (rounded all corners)
        c.setFillColor(LIGHT)
        c.roundRect(x, y-h, w, h, 5, fill=1, stroke=0)

        # 2. Gold header — draw as roundRect (top corners rounded) +
        #    a plain rect over the bottom half so bottom edge is flat
        HEADER_H = 16
        c.setFillColor(GOLD)
        # Full rounded rect for the header (gets rounded top corners)
        c.roundRect(x, y-HEADER_H, w, HEADER_H, 5, fill=1, stroke=0)
        # Cover the bottom half of that roundRect with a flat rect
        # so only the TOP corners remain rounded
        c.rect(x, y-HEADER_H, w, HEADER_H//2, fill=1, stroke=0)

        # 3. Outer border (rounded all corners, drawn last so it sits on top)
        c.setStrokeColor(BORDER); c.setLineWidth(0.7)
        c.roundRect(x, y-h, w, h, 5, fill=0, stroke=1)

        # 4. Thin separator line between header and content
        c.setStrokeColor(colors.HexColor('#B8A060')); c.setLineWidth(0.5)
        c.line(x+1, y-HEADER_H, x+w-1, y-HEADER_H)

        # 5. Header title text
        c.setFillColor(DARK); c.setFont('Helvetica-Bold', 7.5)
        c.drawString(x+10, y-11, title)

    gold_box(18, MY, 248, BH, 'INVOICE DETAILS')
    rows = [
        ('Invoice Number',  d['inv_no']),
        ('Invoice Date',    d['inv_dt'].strftime('%d %B %Y')),
        ('Due Date',        d['due_dt'].strftime('%d %B %Y')),
        ('Payment Terms',   d['terms']),
    ]
    if d['proj_ref']:
        rows.append(('Project Ref', d['proj_ref']))
    ry = MY-32
    for k, v in rows:
        c.setFillColor(MID); c.setFont('Helvetica', 8)
        c.drawString(28, ry, k + ':')
        c.setFillColor(DARK); c.setFont('Helvetica-Bold', 8.5)
        c.drawString(120, ry, str(v)[:30])
        ry -= 13

    gold_box(W-268, MY, 250, BH, 'BILL TO')
    c.setFillColor(DARK); c.setFont('Helvetica-Bold', 10)
    c.drawString(W-258, MY-32, d['b_name'][:38])

    blines = []
    if d['b_attn']:  blines.append(f"Attn: {d['b_attn']}")
    blines.append(d['b_addr1'])
    if d['b_addr2']: blines.append(d['b_addr2'])
    blines.append(f"{d['b_city']}, {d['b_state']} {d['b_pin']}")
    if d['b_gstin']: blines.append(f"GSTIN: {d['b_gstin']}")
    if d['b_po']:    blines.append(f"PO Ref: {d['b_po']}")
    by2 = MY-46
    for bl in blines[:5]:
        c.setFillColor(MID); c.setFont('Helvetica', 8)
        c.drawString(W-258, by2, bl[:42])
        by2 -= 12

    # ── PROJECT BAND ─────────────────────────────────────────
    PY = MY-BH-10
    c.setFillColor(DARK2)
    c.roundRect(18, PY-13, W-36, 14, 3, fill=1, stroke=0)
    c.setFillColor(GOLD2); c.setFont('Helvetica-Bold', 8)
    c.drawString(28, PY-8, 'PROJECT:')
    c.setFillColor(CREAM); c.setFont('Helvetica', 8)
    proj = d['proj_desc'] or d['proj_ref'] or d['inv_no']
    c.drawString(82, PY-8, str(proj)[:85])

    # ── TABLE ─────────────────────────────────────────────────
    TT = PY-26
    RH = 15

    CC = {
        'no':   (18,  22), 'desc': (40, 192),
        'hsn':  (232,  45),'qty':  (277,  34),
        'unit': (311,  34),'rate': (345,  62),
        'gst':  (407,  30),'amt':  (437, W-18-437),
    }

    # Header
    c.setFillColor(DARK)
    c.rect(18, TT-RH, W-36, RH, fill=1, stroke=0)
    c.setFillColor(GOLD); c.setFont('Helvetica-Bold', 8)
    for key, lbl, aln in [
        ('no','#','C'),('desc','Description of Work / Materials','L'),
        ('hsn','HSN / SAC','C'),('qty','Qty','C'),('unit','Unit','C'),
        ('rate','Rate (Rs.)','R'),('gst','GST %','C'),('amt','Amount (Rs.)','R'),
    ]:
        x, w = CC[key]
        cy   = TT-RH+4
        if   aln == 'C': c.drawCentredString(x+w/2,  cy, lbl)
        elif aln == 'R': c.drawRightString(x+w-3,    cy, lbl)
        else:            c.drawString(x+4,            cy, lbl)

    c.setStrokeColor(colors.HexColor('#302820')); c.setLineWidth(0.5)
    for key in ['hsn','qty','unit','rate','gst','amt']:
        x, _ = CC[key]; c.line(x, TT, x, TT-RH)

    # Rows
    y = TT-RH
    for i, item in enumerate(d['items']):
        c.setFillColor(WHITE if i%2==0 else STRIPE)
        c.rect(18, y-RH, W-36, RH, fill=1, stroke=0)
        c.setStrokeColor(colors.HexColor('#E0D4B0')); c.setLineWidth(0.3)
        c.line(18, y-RH, W-18, y-RH)

        desc_s = item['desc'] if len(item['desc'])<=45 else item['desc'][:45]+'...'
        vals   = [
            str(item['sno']), desc_s, item['hsn'],
            f"{item['qty']:g}", item['unit'],
            fmt(item['rate']), f"{item['gst']:g}%",
            fmt(item['taxable']),
        ]
        for j,(key,val,aln) in enumerate(zip(
            ['no','desc','hsn','qty','unit','rate','gst','amt'],
            vals,
            ['C','L','C','C','C','R','C','R'],
        )):
            x, w = CC[key]
            ty   = y-RH+4
            c.setFillColor(MID if j==0 else DARK)
            c.setFont('Helvetica-Bold' if j==0 else 'Helvetica', 8)
            if   aln == 'R': c.drawRightString(x+w-3,    ty, val)
            elif aln == 'C': c.drawCentredString(x+w/2,  ty, val)
            else:            c.drawString(x+4,            ty, val)

        c.setStrokeColor(colors.HexColor('#DDD0A8')); c.setLineWidth(0.3)
        for key in ['hsn','qty','unit','rate','gst','amt']:
            cx, _ = CC[key]; c.line(cx, y, cx, y-RH)
        y -= RH

    c.setStrokeColor(GOLD); c.setLineWidth(1.2)
    c.line(18, y, W-18, y)

    # ── TOTALS ────────────────────────────────────────────────
    y -= 6
    bx = W-18-245

    def tot_row(label, amount, bold=False, hi=False, neg=False):
        nonlocal y
        if hi:
            c.setFillColor(DARK)
            c.roundRect(bx-6, y-15, 251, 17, 3, fill=1, stroke=0)
            lc = vc = GOLD
        else:
            lc = MID
            vc = RED if neg else DARK
        sz = 8.5 if hi else 8
        c.setFillColor(lc); c.setFont('Helvetica-Bold' if (bold or hi) else 'Helvetica', sz)
        c.drawString(bx, y-9, label)
        c.setFillColor(vc); c.setFont('Helvetica-Bold' if (bold or hi) else 'Helvetica', sz)
        c.drawRightString(W-22, y-9, ('- Rs. ' if neg else 'Rs. ') + fmt(amount))
        y -= 18

    tot_row('Subtotal (before GST)', totals['subtotal'])
    if totals['disc_amt'] > 0:
        tot_row(f"Discount ({d['disc']}%)", totals['disc_amt'], neg=True)
        tot_row('Taxable Amount', totals['net'], bold=True)
    if d['cgst']:
        tot_row('CGST (9%)', totals['cgst'])
        tot_row('SGST (9%)', totals['sgst'])
    else:
        tot_row('IGST', totals['igst'])
    if d['extra'] > 0:
        tot_row(d['extra_lbl'] or 'Additional Charges', d['extra'])
    if totals['tds_amt'] > 0:
        tot_row(f"TDS Deductible ({d['tds']}% Sec. 194C)", totals['tds_amt'], neg=True)

    y -= 3
    c.setStrokeColor(GOLD); c.setLineWidth(0.8)
    c.line(W-258, y, W-18, y)
    y -= 3
    tot_row('TOTAL AMOUNT PAYABLE', totals['final'], bold=True, hi=True)

    # Amount in words
    y -= 6
    words = f"Rupees {to_words(totals['final'])} Only"
    c.setFillColor(GOLD3)
    c.roundRect(18, y-20, W-36, 20, 4, fill=1, stroke=0)
    c.setStrokeColor(BORDER); c.setLineWidth(0.5)
    c.roundRect(18, y-20, W-36, 20, 4, fill=0, stroke=1)
    c.setFillColor(MID); c.setFont('Helvetica-Bold', 8)
    c.drawString(26, y-12, 'Amount in Words:')
    c.setFillColor(DARK); c.setFont('Helvetica-Bold', 8.5)
    c.drawString(125, y-12, words[:82])

    # ── BANK + TERMS ──────────────────────────────────────────
    y -= 28
    BOT = 82

    gold_box(18, y, 252, BOT, 'BANK DETAILS')
    bky = y-30
    for k, v in [
        ('Bank',         d['bk_name']),
        ('Account Name', d['bk_acnm']),
        ('Account No.',  d['bk_acno']),
        ('IFSC Code',    d['bk_ifsc']),
        ('Account Type', d['bk_type']),
    ]:
        c.setFillColor(MID); c.setFont('Helvetica', 8)
        c.drawString(28, bky, k + ':')
        c.setFillColor(DARK); c.setFont('Helvetica-Bold', 8.5)
        c.drawString(110, bky, v[:32])
        bky -= 12

    gold_box(W-272, y, 254, BOT, 'TERMS & CONDITIONS')
    terms = [
        f"1. Payment due within {d['due_days']} days of invoice date.",
        "2. Interest @ 18% p.a. on overdue amounts.",
        "3. Materials supplied per approved BOQ specs.",
        f"4. Disputes subject to {d['jur']} jurisdiction.",
        "5. This is a computer-generated invoice.",
    ]
    if d['notes']:
        terms.append(f"6. {str(d['notes'])[:50]}")
    ty2 = y-30
    for t in terms[:6]:
        c.setFillColor(DARK); c.setFont('Helvetica', 8)
        c.drawString(W-262, ty2, t[:48])
        ty2 -= 12

    # ── SIGNATURE ─────────────────────────────────────────────
    y = y-BOT-14
    scx, scy = W-80, y-22

    c.setStrokeColor(GOLD);  c.setLineWidth(1)
    c.circle(scx, scy, 26, fill=0, stroke=1)
    c.setStrokeColor(GOLD2); c.setLineWidth(0.4)
    c.circle(scx, scy, 23, fill=0, stroke=1)
    c.setFillColor(GOLD); c.setFont('Helvetica-Bold', 6)
    c.drawCentredString(scx, scy+8,  'NALAKATH')
    c.setFont('Helvetica-Bold', 5.5)
    c.drawCentredString(scx, scy+1,  'CONSTRUCTIONS')
    c.setFont('Helvetica', 5)
    c.drawCentredString(scx, scy-6,  'PVT. LTD.')
    c.drawCentredString(scx, scy-12, 'MALAPPURAM')

    c.setStrokeColor(BORDER); c.setLineWidth(0.8)
    c.line(W-200, y-40, W-22, y-40)
    c.setFillColor(DARK); c.setFont('Helvetica-Bold', 8.5)
    c.drawCentredString(W-111, y-50, 'Authorised Signatory')
    c.setFillColor(MID); c.setFont('Helvetica', 7.5)
    c.drawCentredString(W-111, y-62, f"For {d['s_name']}")

    c.setFillColor(MID); c.setFont('Helvetica-Oblique', 7)
    c.drawString(22, y-50, 'We declare that this invoice shows the actual price of the goods / services described')
    c.drawString(22, y-61, 'and that all particulars are true and correct to the best of our knowledge.')

    # ── FOOTER ────────────────────────────────────────────────
    c.setFillColor(DARK)
    c.rect(0, 0, W, 28, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, 27, W, 2, fill=1, stroke=0)
    c.setFillColor(CREAM); c.setFont('Helvetica', 7.5)
    c.drawCentredString(W/2, 10,
        f"{d['s_name']}   |   {d['s_addr1']}, {d['s_addr2']}   |   {d['s_phone']}   |   {d['s_web']}")
    c.setFillColor(GOLD2); c.setFont('Helvetica', 7)
    c.drawRightString(W-22, 10, 'Page 1 of 1')

    c.save()
    return d['out']


# ────────────────────────────────────────────────────────────
# SUMMARY
# ────────────────────────────────────────────────────────────

def print_summary(d, out):
    t = calc(d)
    print()
    print("╔════════════════════════════════════════════════╗")
    print("║              INVOICE SUMMARY                  ║")
    print("╠════════════════════════════════════════════════╣")
    print(f"║  Invoice   : {d['inv_no']:<33}║")
    print(f"║  Client    : {d['b_name'][:32]:<33}║")
    print(f"║  Date      : {d['inv_dt'].strftime('%d %B %Y'):<33}║")
    print(f"║  Due Date  : {d['due_dt'].strftime('%d %B %Y'):<33}║")
    print("╠════════════════════════════════════════════════╣")
    print(f"║  Items     : {len(d['items']):<33}║")
    print(f"║  Subtotal  : Rs. {fmt(t['subtotal']):<29}║")
    if d['cgst']:
        print(f"║  CGST      : Rs. {fmt(t['cgst']):<29}║")
        print(f"║  SGST      : Rs. {fmt(t['sgst']):<29}║")
    else:
        print(f"║  IGST      : Rs. {fmt(t['igst']):<29}║")
    if t['tds_amt'] > 0:
        print(f"║  TDS (-)   : Rs. {fmt(t['tds_amt']):<29}║")
    print("╠════════════════════════════════════════════════╣")
    print(f"║  TOTAL     : Rs. {fmt(t['final']):<29}║")
    print("╚════════════════════════════════════════════════╝")
    print(f"\n  ✅  Saved : {out}")
    print(f"  📄  Size  : {os.path.getsize(out):,} bytes\n")


# ────────────────────────────────────────────────────────────
# MAIN
# ────────────────────────────────────────────────────────────

def main():
    try:
        import reportlab, PIL  # noqa: F401
    except ImportError as e:
        print(f"\n  ⚠  Missing: {e}")
        print("  Run:  pip install reportlab pillow\n")
        sys.exit(1)

    try:
        d   = collect_data()
        print("\n  ⏳  Generating PDF...")
        out = make_pdf(d)
        print_summary(d, out)
        again = input("  Generate another invoice? (y/n) [n]: ").strip().lower()
        if again == 'y':
            main()
    except KeyboardInterrupt:
        print("\n\n  Cancelled.\n")
        sys.exit(0)
    except Exception as e:
        print(f"\n  ❌  Error: {e}")
        import traceback; traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
