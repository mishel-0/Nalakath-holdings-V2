"use client";

import { useState, useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Printer, X, Plus, Trash2, Building2, User, CreditCard } from "lucide-react";
import { useDivision } from "@/context/DivisionContext";
import { cn } from "@/lib/utils";

// EXECUTIVE COLORS FROM PYTHON SCRIPT
const DARK = "#0C0A07";
const GOLD = "#C9A84C";
const GOLD3 = "#F0E4B8";
const CREAM = "#F5EDD6";
const LIGHT = "#FDFBF7";
const MID = "#6B5C42";
const BORDER = "#CEBB8A";
const STRIPE = "#F7F2E8";

function fmt(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const parts = rounded.toFixed(2).split(".");
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== "") lastThree = "," + lastThree;
  const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + "." + parts[1];
  return res;
}

function numberToWords(n: number): string {
  const amount = Math.round(n);
  if (amount === 0) return "RUPEES ZERO ONLY";

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const b100 = (x: number): string => {
    if (x < 20) return ones[x];
    return tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '');
  };

  const b1000 = (x: number): string => {
    if (x < 100) return b100(x);
    return ones[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' and ' + b100(x % 100) : '');
  };

  const parts: string[] = [];
  const crores = Math.floor(amount / 10000000);
  const lakhs = Math.floor((amount % 10000000) / 100000);
  const thousands = Math.floor((amount % 100000) / 1000);
  const remaining = amount % 1000;

  if (crores) parts.push(b1000(crores) + ' Crore');
  if (lakhs) parts.push(b1000(lakhs) + ' Lakh');
  if (thousands) parts.push(b1000(thousands) + ' Thousand');
  if (remaining) parts.push(b1000(remaining));

  return "RUPEES " + parts.join(' ').toUpperCase() + " ONLY";
}

export default function InvoiceGeneratorPage() {
  const { activeDivision } = useDivision();
  const [items, setItems] = useState([{ id: Date.now(), description: "", hsn: "9954", qty: 1, unit: "Cu.m", rate: 0, gst: 18 }]);
  const [invoiceToPrint, setInvoiceToPrint] = useState<any>(null);

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", hsn: "9954", qty: 1, unit: "Cu.m", rate: 0, gst: 18 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const d = {
      inv_no: formData.get("inv_no"),
      inv_date: formData.get("inv_date"),
      terms: formData.get("terms") || "Net 30 Days",
      proj_ref: formData.get("proj_ref"),
      proj_desc: formData.get("proj_desc"),
      b_name: formData.get("b_name"),
      b_attn: formData.get("b_attn"),
      b_gstin: formData.get("b_gstin"),
      b_addr1: formData.get("b_addr1"),
      b_city: formData.get("b_city"),
      b_pin: formData.get("b_pin"),
      tds: Number(formData.get("tds")) || 0,
      disc: Number(formData.get("disc")) || 0,
      extra: Number(formData.get("extra")) || 0,
      extra_lbl: formData.get("extra_lbl") || "Additional Charges",
      is_cgst: formData.get("gst_type") === "C",
      jur: formData.get("jur") || "Malappuram",
      items: items
    };

    setInvoiceToPrint(d);
  };

  const totals = useMemo(() => {
    if (!invoiceToPrint) return null;
    
    const subtotal = invoiceToPrint.items.reduce((acc: number, i: any) => acc + (i.qty * i.rate), 0);
    const disc_amt = Math.round((subtotal * invoiceToPrint.disc / 100) * 100) / 100;
    const net = subtotal - disc_amt;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    invoiceToPrint.items.forEach((item: any) => {
      const base = Math.round((item.qty * item.rate * (1 - invoiceToPrint.disc / 100)) * 100) / 100;
      const g = Math.round((base * item.gst / 100) * 100) / 100;
      
      if (invoiceToPrint.is_cgst) {
        cgst += Math.round((g / 2) * 100) / 100;
        sgst += Math.round((g / 2) * 100) / 100;
      } else {
        igst += g;
      }
    });

    cgst = Math.round(cgst * 100) / 100;
    sgst = Math.round(sgst * 100) / 100;
    igst = Math.round(igst * 100) / 100;
    const total_gst = cgst + sgst + igst;
    
    const pre_tds = net + total_gst + invoiceToPrint.extra;
    const tds_amt = Math.round((net * invoiceToPrint.tds / 100) * 100) / 100;
    const final = Math.round((pre_tds - tds_amt) * 100) / 100;

    return { subtotal, disc_amt, net, cgst, sgst, igst, total_gst, tds_amt, final };
  }, [invoiceToPrint]);


  return (
    <>
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            <header className="flex flex-col gap-2">
              <Badge variant="outline" className="w-fit rounded-full px-4 py-1 text-[9px] uppercase tracking-widest font-bold border-primary/40 text-primary bg-primary/5">
                EXECUTIVE FISCAL HUB
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase mt-2">Tax Invoice Generator</h1>
              <p className="text-muted-foreground text-sm">Professional billing engine for {activeDivision.name}.</p>
            </header>

            <Card className="glass border-white/5 p-8 rounded-[3rem]">
              <form onSubmit={handleGenerate} className="space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">1 / 4 — Invoice Metadata</h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Invoice Number</Label>
                      <Input name="inv_no" placeholder="NC-2026-0001" required className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Invoice Date</Label>
                      <Input name="inv_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Project Description</Label>
                      <Input name="proj_desc" placeholder="e.g. Infrastructure Work" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">2 / 4 — Bill To (Client)</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Client Name</Label>
                      <Input name="b_name" required className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">GSTIN</Label>
                      <Input name="b_gstin" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Address</Label>
                      <Input name="b_addr1" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">City</Label>
                        <Input name="b_city" defaultValue="Areecode" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">PIN</Label>
                        <Input name="b_pin" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h3 className="text-sm font-black uppercase tracking-widest">3 / 4 — Line Items</h3>
                    </div>
                    <Button type="button" onClick={addItem} variant="ghost" className="text-[10px] uppercase font-bold tracking-widest">
                      <Plus className="h-3 w-3 mr-2" /> Add Item
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {items.map((item, idx) => (
                      <div key={item.id} className="grid md:grid-cols-12 gap-4 items-end bg-white/5 p-4 rounded-2xl">
                        <div className="md:col-span-1 text-center font-black opacity-30">{idx + 1}</div>
                        <div className="md:col-span-4 space-y-1">
                          <Label className="text-[8px] uppercase font-bold">Work Description</Label>
                          <Input value={item.description} onChange={(e) => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} required className="bg-white/5 border-white/10 rounded-xl h-10" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[8px] uppercase font-bold">HSN/SAC</Label>
                          <Input value={item.hsn} onChange={(e) => { const n = [...items]; n[idx].hsn = e.target.value; setItems(n); }} className="bg-white/5 border-white/10 rounded-xl h-10 font-mono text-xs" />
                        </div>
                        <div className="md:col-span-1 space-y-1">
                          <Label className="text-[8px] uppercase font-bold">Qty</Label>
                          <Input type="number" value={item.qty} onChange={(e) => { const n = [...items]; n[idx].qty = Number(e.target.value); setItems(n); }} className="bg-white/5 border-white/10 rounded-xl h-10" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[8px] uppercase font-bold">Rate (₹)</Label>
                          <Input type="number" value={item.rate || ""} onChange={(e) => { const n = [...items]; n[idx].rate = Number(e.target.value); setItems(n); }} className="bg-white/5 border-white/10 rounded-xl h-10 font-mono" />
                        </div>
                        <div className="md:col-span-1 space-y-1">
                          <Label className="text-[8px] uppercase font-bold">GST %</Label>
                          <Input type="number" value={item.gst} onChange={(e) => { const n = [...items]; n[idx].gst = Number(e.target.value); setItems(n); }} className="bg-white/5 border-white/10 rounded-xl h-10" />
                        </div>
                        <div className="md:col-span-1 flex justify-center">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">4 / 4 — Adjustments</h3>
                  </div>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold">TDS % (Sec. 194C)</Label>
                      <Input name="tds" type="number" step="0.1" defaultValue="0.0" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold">Discount %</Label>
                      <Input name="disc" type="number" step="0.1" defaultValue="0.0" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold">GST Type</Label>
                      <select name="gst_type" className="w-full bg-white/5 border border-white/10 h-12 rounded-2xl px-4 text-sm appearance-none outline-none focus:ring-1 focus:ring-primary">
                        <option value="C" className="bg-zinc-900">CGST + SGST (Local)</option>
                        <option value="I" className="bg-zinc-900">IGST (Inter-state)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold">Extra Rs.</Label>
                        <Input name="extra" type="number" defaultValue="0" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold">Label</Label>
                        <Input name="extra_lbl" defaultValue="Extra" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold">Jurisdiction</Label>
                      <Input name="jur" defaultValue="Malappuram" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-20 rounded-[2.5rem] gold-gradient text-black font-black text-xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                  GENERATE PROFESSIONAL PREVIEW
                </Button>
              </form>
            </Card>
          </div>
        </main>


      {invoiceToPrint && totals && (() => {
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 print:p-0 print:bg-white print:relative print:inset-auto print:flex-none overflow-y-auto">
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * { visibility: hidden; }
                .print-content, .print-content * { visibility: visible; }
                .print-content { 
                  position: absolute; 
                  left: 0; 
                  top: 0; 
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                @page { size: A4; margin: 0; }
                .no-print { display: none !important; }
              }
            `}} />
            <Card className="w-full max-w-4xl bg-white text-[#0C0A07] overflow-hidden rounded-none print:shadow-none shadow-2xl relative animate-in zoom-in-95 duration-300 font-sans border-none pb-10 print-content">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 print:hidden h-10 w-10 bg-black/10 hover:bg-black/20 text-black rounded-full z-[110] no-print" onClick={() => setInvoiceToPrint(null)}>
                <X className="h-5 w-5" />
              </Button>

              
              {/* HEADER - STRICT PYTHON MODEL */}
              <div style={{ backgroundColor: DARK }} className="h-[108px] w-full relative flex items-center px-10">
                <div style={{ backgroundColor: GOLD }} className="absolute top-0 left-0 w-full h-1" />
                <div style={{ backgroundColor: GOLD }} className="absolute bottom-0 left-0 w-full h-0.5" />
                
                <div className="flex items-center gap-6">
                  {/* LOGO SEAL */}
                  <div style={{ borderColor: GOLD }} className="h-20 w-20 rounded-full border-2 flex flex-col items-center justify-center text-white relative overflow-hidden bg-black/20">
                    <div style={{ borderColor: GOLD }} className="absolute inset-1 rounded-full border opacity-40" />
                    <span style={{ color: GOLD }} className="text-xl font-black tracking-tighter leading-none mb-0.5">NH</span>
                    <span className="text-[5px] font-bold uppercase tracking-[0.1em] opacity-80">Nalakath</span>
                  </div>

                  <div>
                    <h1 style={{ color: GOLD }} className="text-2xl font-black tracking-tight uppercase leading-none mb-1">NALAKATH CONSTRUCTIONS PVT. LTD.</h1>
                    <div style={{ backgroundColor: GOLD }} className="h-[0.5px] w-48 mb-2 opacity-50" />
                    <p style={{ color: GOLD3 }} className="text-[10px] italic font-medium opacity-80 leading-none mb-2">Building Trust. Building Kerala.</p>
                    <p className="text-[8px] text-white/60 uppercase tracking-widest font-bold leading-relaxed">
                      Nalakath Hub, Ward No. 4, Areecode, Malappuram, Kerala 673639<br/>
                      +91 97444 00100  |  info@nalakathindia.com  |  GSTIN: 32XXXXXX1234Z5
                    </p>
                  </div>
                </div>
              </div>

              {/* TITLE BAND */}
              <div style={{ backgroundColor: GOLD }} className="h-8 w-full flex items-center justify-between px-10">
                <span className="text-sm font-black uppercase text-black">Tax Invoice</span>
                <span className="text-[9px] font-bold text-black/70 uppercase">Original for Recipient | {invoiceToPrint.is_cgst ? 'CGST + SGST' : 'IGST'} | {invoiceToPrint.jur} Jurisdiction</span>
              </div>

              <div className="p-10 space-y-8">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-10">
                  <div style={{ backgroundColor: LIGHT, borderColor: BORDER }} className="border rounded-xl p-6 relative overflow-hidden">
                    <div style={{ backgroundColor: GOLD }} className="absolute top-0 left-0 w-full h-6 px-4 flex items-center">
                      <span className="text-[9px] font-black text-black uppercase">Invoice Details</span>
                    </div>
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-xs"><span style={{ color: MID }} className="font-bold uppercase tracking-widest text-[9px]">Invoice Number:</span><span className="font-black">{invoiceToPrint.inv_no}</span></div>
                      <div className="flex justify-between text-xs"><span style={{ color: MID }} className="font-bold uppercase tracking-widest text-[9px]">Invoice Date:</span><span className="font-black">{new Date(invoiceToPrint.inv_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                      <div className="flex justify-between text-xs"><span style={{ color: MID }} className="font-bold uppercase tracking-widest text-[9px]">Payment Terms:</span><span className="font-black">{invoiceToPrint.terms}</span></div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: LIGHT, borderColor: BORDER }} className="border rounded-xl p-6 relative overflow-hidden">
                    <div style={{ backgroundColor: GOLD }} className="absolute top-0 left-0 w-full h-6 px-4 flex items-center">
                      <span className="text-[9px] font-black text-black uppercase">Bill To</span>
                    </div>
                    <div className="mt-6">
                      <p className="text-sm font-black uppercase text-black mb-1">{invoiceToPrint.b_name}</p>
                      {invoiceToPrint.b_attn && <p style={{ color: MID }} className="text-[9px] font-bold uppercase mb-1">Attn: {invoiceToPrint.b_attn}</p>}
                      <p style={{ color: MID }} className="text-[10px] font-bold uppercase leading-relaxed">{invoiceToPrint.b_addr1 || "NO ADDRESS RECORDED"}</p>
                      <p style={{ color: MID }} className="text-[10px] font-bold uppercase">{invoiceToPrint.b_city} {invoiceToPrint.b_pin}</p>
                      <p style={{ color: MID }} className="text-[10px] font-black mt-1">GSTIN: {invoiceToPrint.b_gstin || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* PROJECT BAND */}
                <div style={{ backgroundColor: "#181410" }} className="rounded-lg h-8 flex items-center px-4 gap-3">
                  <span style={{ color: "#DFC06A" }} className="text-[9px] font-black uppercase">Project:</span>
                  <span className="text-[10px] text-white/80 font-medium uppercase truncate">{invoiceToPrint.proj_desc || invoiceToPrint.inv_no}</span>
                </div>

                {/* TABLE */}
                <div style={{ borderColor: BORDER }} className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead style={{ backgroundColor: DARK }}>
                      <tr>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest border-r border-white/10 w-10 text-center">#</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest border-r border-white/10">Description of Work / Materials</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">HSN/SAC</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">Qty</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">Unit</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-right border-r border-white/10">Rate (Rs.)</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">GST %</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-right">Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] font-medium">
                      {invoiceToPrint.items.map((item: any, idx: number) => (
                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "white" : STRIPE }} className="border-b border-[#E0D4B0] last:border-0">
                          <td className="p-4 text-center border-r border-[#DDD0A8]">{idx + 1}</td>
                          <td className="p-4 uppercase border-r border-[#DDD0A8] max-w-[200px] break-words">{item.description}</td>
                          <td className="p-4 text-center border-r border-[#DDD0A8] text-muted-foreground">{item.hsn}</td>
                          <td className="p-4 text-center border-r border-[#DDD0A8] font-black">{item.qty}</td>
                          <td className="p-4 text-center border-r border-[#DDD0A8]">{item.unit}</td>
                          <td className="p-4 text-right border-r border-[#DDD0A8] font-mono">{fmt(item.rate)}</td>
                          <td className="p-4 text-center border-r border-[#DDD0A8]">{item.gst}%</td>
                          <td className="p-4 text-right font-black font-mono">{fmt(item.qty * item.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* TOTALS */}
                <div className="flex justify-end pt-4">
                  <div className="w-[320px] space-y-2">
                    <div className="flex justify-between text-[10px] font-bold px-2 text-[#6B5C42]"><span>Subtotal (before GST)</span><span className="font-mono text-black">Rs. {fmt(totals.subtotal)}</span></div>
                    {totals.disc_amt > 0 && (
                      <div className="flex justify-between text-[10px] font-bold px-2 text-[#A02818]"><span>Discount ({invoiceToPrint.disc}%)</span><span className="font-mono">- Rs. {fmt(totals.disc_amt)}</span></div>
                    )}
                    {invoiceToPrint.is_cgst ? (
                      <>
                        <div className="flex justify-between text-[10px] font-bold px-2 text-[#6B5C42]"><span>CGST</span><span className="font-mono text-black">Rs. {fmt(totals.cgst)}</span></div>
                        <div className="flex justify-between text-[10px] font-bold px-2 text-[#6B5C42]"><span>SGST</span><span className="font-mono text-black">Rs. {fmt(totals.sgst)}</span></div>
                      </>
                    ) : (
                      <div className="flex justify-between text-[10px] font-bold px-2 text-[#6B5C42]"><span>IGST</span><span className="font-mono text-black">Rs. {fmt(totals.igst)}</span></div>
                    )}
                    {invoiceToPrint.extra > 0 && (
                      <div className="flex justify-between text-[10px] font-bold px-2 text-[#6B5C42]"><span>{invoiceToPrint.extra_lbl}</span><span className="font-mono text-black">Rs. {fmt(invoiceToPrint.extra)}</span></div>
                    )}
                    {totals.tds_amt > 0 && (
                      <div className="flex justify-between text-[10px] font-bold px-2 text-[#A02818] border-b border-black/5 pb-2"><span>TDS Deductible (Sec. 194C)</span><span className="font-mono">- Rs. {fmt(totals.tds_amt)}</span></div>
                    )}
                    
                    <div style={{ backgroundColor: DARK }} className="relative mt-4 rounded-lg p-4 flex justify-between items-center shadow-xl">
                      <div className="space-y-0.5">
                        <p style={{ color: GOLD }} className="text-[8px] font-black uppercase tracking-[0.2em]">Total Amount Payable</p>
                        <p style={{ color: GOLD }} className="text-2xl font-black tracking-tight">Rs. {fmt(totals.final)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AMOUNT IN WORDS */}
                <div style={{ backgroundColor: GOLD3, borderColor: BORDER }} className="border rounded-lg p-4 flex items-center gap-6">
                  <span className="text-[9px] font-black text-[#6B5C42] uppercase tracking-[0.1em] shrink-0">Amount in Words:</span>
                  <p className="text-[10px] font-black italic text-black leading-relaxed uppercase">{numberToWords(totals.final)}</p>
                </div>

                {/* BOTTOM PANELS */}
                <div className="grid grid-cols-2 gap-10">
                  <div style={{ borderColor: BORDER, backgroundColor: LIGHT }} className="border rounded-xl p-6 relative overflow-hidden text-[10px]">
                    <div style={{ backgroundColor: GOLD }} className="absolute top-0 left-0 w-full h-6 px-4 flex items-center">
                      <span className="text-[9px] font-black text-black uppercase">Bank Details</span>
                    </div>
                    <div className="mt-6 space-y-1.5">
                      <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase tracking-widest text-[8px]">Bank:</span><span className="font-black text-black">STATE BANK OF INDIA, PERINTHALMANNA</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase tracking-widest text-[8px]">Account Name:</span><span className="font-black text-black">NALAKATH CONSTRUCTIONS PVT. LTD.</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase tracking-widest text-[8px]">Account No.:</span><span className="font-black text-black font-mono text-[10px]">32XXXXXXXXXX51</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase tracking-widest text-[8px]">IFSC Code:</span><span className="font-black text-black font-mono">SBIN0001234</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase tracking-widest text-[8px]">Type:</span><span className="font-black text-black">CURRENT ACCOUNT</span></div>
                    </div>
                  </div>

                  <div style={{ borderColor: BORDER, backgroundColor: LIGHT }} className="border rounded-xl p-6 relative overflow-hidden text-[10px]">
                    <div style={{ backgroundColor: GOLD }} className="absolute top-0 left-0 w-full h-6 px-4 flex items-center">
                      <span className="text-[9px] font-black text-black uppercase">Terms & Conditions</span>
                    </div>
                    <div className="mt-6 space-y-1">
                      <p className="text-[8px] leading-tight text-zinc-700">1. Payment due within 30 days of invoice date.</p>
                      <p className="text-[8px] leading-tight text-zinc-700">2. Interest @ 18% p.a. on overdue amounts.</p>
                      <p className="text-[8px] leading-tight text-zinc-700">3. Materials supplied per approved BOQ specs.</p>
                      <p className="text-[8px] leading-tight text-zinc-700">4. Disputes subject to {invoiceToPrint.jur} jurisdiction.</p>
                      <p className="text-[8px] leading-tight text-zinc-700">5. This is a computer-generated invoice.</p>
                    </div>
                  </div>
                </div>

                {/* SIGNATURE SECTION */}
                <div className="flex justify-between items-end pt-10">
                   <div className="max-w-[300px]">
                      <p style={{ color: MID }} className="text-[8px] italic leading-relaxed">
                        We declare that this invoice shows the actual price of the goods / services described and that all particulars are true and correct to the best of our knowledge.
                      </p>
                   </div>
                   
                   <div className="flex flex-col items-center gap-6 relative">
                      {/* SEAL CIRCLE */}
                      <div style={{ borderColor: GOLD }} className="h-14 w-14 rounded-full border flex flex-col items-center justify-center opacity-40 absolute -top-8 -left-12 rotate-[-15deg]">
                         <span style={{ color: GOLD }} className="text-[6px] font-black leading-none">NALAKATH</span>
                         <span style={{ color: GOLD }} className="text-[5px] font-bold leading-none">CONSTRUCTIONS</span>
                         <span style={{ color: GOLD }} className="text-[4px] font-medium leading-none">MALAPPURAM</span>
                      </div>

                      <div className="text-center space-y-1">
                        <div className="h-[1px] w-48 bg-black mx-auto mb-2" />
                        <p className="text-[10px] font-black text-black uppercase tracking-[0.1em]">Authorised Signatory</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">For Nalakath Constructions Pvt. Ltd.</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* FOOTER */}
              <div style={{ backgroundColor: DARK }} className="h-10 w-full flex items-center justify-between px-10 border-t border-white/5">
                <p style={{ color: GOLD3 }} className="text-[7px] font-medium uppercase tracking-[0.1em]">
                  Nalakath Constructions Pvt. Ltd. • Nalakath Hub, Areecode, Malappuram • +91 97444 00100 • nalakathindia.com
                </p>
                <p style={{ color: GOLD2 }} className="text-[7px] font-bold uppercase tracking-widest">Page 1 of 1</p>
              </div>

              {/* PRINT ACTIONS */}
              <div className="print:hidden flex gap-4 justify-center mt-6 pt-6 border-t border-zinc-100 pb-6">
                <Button variant="outline" className="rounded-full px-8 h-12 font-bold uppercase text-[10px] tracking-widest" onClick={() => setInvoiceToPrint(null)}>Discard Preview</Button>
                <Button className="rounded-full px-12 h-12 font-bold uppercase text-[10px] tracking-widest gold-gradient text-black shadow-xl" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Export to PDF</Button>
              </div>
            </Card>
          </div>
        );
      })()}
    </>
  );
}

