"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Printer, X, Plus, Trash2, Building2, User, CreditCard } from "lucide-react";
import { useDivision } from "@/context/DivisionContext";
import { cn } from "@/lib/utils";

function indianNumberFormat(n: number): string {
  const parts = n.toFixed(2).split(".");
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== "") lastThree = "," + lastThree;
  const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + "." + parts[1];
  return res;
}

function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: any): string => {
    if ((n = n.toString()).length > 9) return 'overflow';
    const n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += (Number(n_array[1]) != 0) ? (a[Number(n_array[1])] || b[Number(n_array[1][0])] + ' ' + a[Number(n_array[1][1])]) + 'Crore ' : '';
    str += (Number(n_array[2]) != 0) ? (a[Number(n_array[2])] || b[Number(n_array[2][0])] + ' ' + a[Number(n_array[2][1])]) + 'Lakh ' : '';
    str += (Number(n_array[3]) != 0) ? (a[Number(n_array[3])] || b[Number(n_array[3][0])] + ' ' + a[Number(n_array[3][1])]) + 'Thousand ' : '';
    str += (Number(n_array[4]) != 0) ? (a[Number(n_array[4])] || b[Number(n_array[4][0])] + ' ' + a[Number(n_array[4][1])]) + 'Hundred ' : '';
    str += (Number(n_array[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[Number(n_array[5][0])] + ' ' + a[Number(n_array[5][1])]) : '';
    return str;
  };

  return "RUPEES " + inWords(Math.floor(num)).toUpperCase() + "ONLY";
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
      payment_terms: formData.get("terms") || "Net 30 Days",
      project_ref: formData.get("proj_ref"),
      project_desc: formData.get("proj_desc"),
      b_name: formData.get("b_name"),
      b_attn: formData.get("b_attn"),
      b_addr1: formData.get("b_addr1"),
      b_addr2: formData.get("b_addr2"),
      b_city: formData.get("b_city"),
      b_state: formData.get("b_state") || "Kerala",
      b_pin: formData.get("b_pin"),
      b_gstin: formData.get("b_gstin"),
      tds_percent: Number(formData.get("tds")) || 2.0,
      discount_percent: Number(formData.get("disc")) || 0.0,
      items: items
    };

    setInvoiceToPrint(d);
  };

  const totals = useMemo(() => {
    if (!invoiceToPrint) return null;
    const subtotal = invoiceToPrint.items.reduce((acc: number, i: any) => acc + (i.qty * i.rate), 0);
    const disc_amt = (subtotal * invoiceToPrint.discount_percent) / 100;
    const taxable = subtotal - disc_amt;
    
    let cgst = 0, sgst = 0;
    invoiceToPrint.items.forEach((i: any) => {
      const line_taxable = (i.qty * i.rate * (1 - invoiceToPrint.discount_percent / 100));
      const line_gst = (line_taxable * i.gst) / 100;
      cgst += line_gst / 2;
      sgst += line_gst / 2;
    });

    const tds_amt = (taxable * invoiceToPrint.tds_percent) / 100;
    const total_gst = cgst + sgst;
    const final = taxable + total_gst - tds_amt;

    return { subtotal, disc_amt, taxable, cgst, sgst, tds_amt, total_gst, final };
  }, [invoiceToPrint]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0 overflow-hidden">
          <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            <header className="flex flex-col gap-2">
              <Badge variant="outline" className="w-fit rounded-full px-4 py-1 text-[9px] uppercase tracking-widest font-bold border-primary/40 text-primary bg-primary/5">
                FISCAL ENGINE V4.0
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase mt-2">Tax Invoice Hub</h1>
              <p className="text-muted-foreground text-sm">Professional PDF generator for {activeDivision.name}.</p>
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
                      <Input name="inv_no" placeholder="NC-2025-0001" required className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Invoice Date</Label>
                      <Input name="inv_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Payment Terms</Label>
                      <Input name="terms" defaultValue="Net 30 Days" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">2 / 4 — Bill To</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Client Name</Label>
                      <Input name="b_name" required className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">GSTIN / ID</Label>
                      <Input name="b_gstin" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
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
                      <Plus className="h-3 w-3 mr-2" /> Add Service
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {items.map((item, idx) => (
                      <div key={item.id} className="grid md:grid-cols-12 gap-4 items-end bg-white/5 p-4 rounded-2xl">
                        <div className="md:col-span-1 text-center font-black opacity-30">{idx + 1}</div>
                        <div className="md:col-span-4 space-y-1">
                          <Label className="text-[8px] uppercase font-bold">Description</Label>
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
                      <Input name="tds" type="number" step="0.1" defaultValue="2.0" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold">Discount %</Label>
                      <Input name="disc" type="number" step="0.1" defaultValue="0.0" className="bg-white/5 border-white/10 h-12 rounded-2xl" />
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
      </div>

      {invoiceToPrint && totals && (() => {
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 print:p-0 print:bg-white overflow-y-auto">
            <Card className="w-full max-w-4xl bg-white text-[#0C0A07] overflow-hidden rounded-none print:shadow-none shadow-2xl relative animate-in zoom-in-95 duration-300 font-sans border-none p-10 md:p-16">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 print:hidden h-10 w-10 bg-black/10 hover:bg-black/20 text-black rounded-full z-[110]" onClick={() => setInvoiceToPrint(null)}>
                <X className="h-5 w-5" />
              </Button>
              
              {/* Header Layout from Screenshot */}
              <div className="flex justify-between items-start mb-8 border-b border-[#CEBB8A] pb-4">
                <div>
                  <h1 className="text-4xl font-black tracking-tight text-[#0C0A07] uppercase">TAX INVOICE</h1>
                </div>
                <div className="flex gap-6 text-[10px] font-bold text-[#6B5C42] uppercase items-center h-full pt-4">
                  <span>ORIGINAL FOR RECIPIENT</span>
                  <div className="h-4 w-px bg-[#CEBB8A]" />
                  <span>CGST + SGST</span>
                  <div className="h-4 w-px bg-[#CEBB8A]" />
                  <span>MALAPPURAM JURISDICTION</span>
                </div>
              </div>

              {/* Meta Boxes from Screenshot */}
              <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="rounded-[2.5rem] border border-[#CEBB8A] p-8 space-y-4">
                  <h3 className="text-[11px] font-black text-[#6B5C42] uppercase tracking-[0.2em] mb-6">INVOICE DETAILS</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B5C42] font-bold uppercase tracking-widest text-[10px]">INVOICE NUMBER:</span>
                      <span className="font-black">{invoiceToPrint.inv_no}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B5C42] font-bold uppercase tracking-widest text-[10px]">INVOICE DATE:</span>
                      <span className="font-black">{new Date(invoiceToPrint.inv_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B5C42] font-bold uppercase tracking-widest text-[10px]">PAYMENT TERMS:</span>
                      <span className="font-black">{invoiceToPrint.payment_terms}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2.5rem] border border-[#CEBB8A] p-8 space-y-4">
                  <h3 className="text-[11px] font-black text-[#6B5C42] uppercase tracking-[0.2em] mb-6">BILL TO</h3>
                  <div>
                    <p className="text-2xl font-black text-[#0C0A07] uppercase mb-3">{invoiceToPrint.b_name}</p>
                    <p className="text-[11px] font-bold text-[#6B5C42] uppercase leading-relaxed max-w-[200px]">{invoiceToPrint.b_gstin || "NO ADDRESS RECORDED"}</p>
                  </div>
                </div>
              </div>

              {/* Project Crescent Icon from Screenshot */}
              <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-4 bg-[#C9A84C] rounded-r-full" />
                <span className="text-[11px] font-black tracking-[0.2em] text-[#6B5C42] uppercase">PROJECT:</span>
                <span className="text-sm font-black uppercase text-[#0C0A07]">{invoiceToPrint.project_ref || invoiceToPrint.inv_no}</span>
              </div>

              {/* Precise Table from Screenshot */}
              <div className="rounded-[2rem] border border-[#CEBB8A] overflow-hidden mb-12">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#FDFBF7]">
                    <tr className="border-b border-[#CEBB8A]">
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-center text-[#6B5C42] border-r border-[#CEBB8A]">#</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#6B5C42] border-r border-[#CEBB8A]">WORK DESCRIPTION</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-center text-[#6B5C42] border-r border-[#CEBB8A]">HSN/SAC</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-center text-[#6B5C42] border-r border-[#CEBB8A]">QTY</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-right text-[#6B5C42] border-r border-[#CEBB8A]">RATE (RS.)</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-center text-[#6B5C42] border-r border-[#CEBB8A]">GST %</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-right text-[#6B5C42]">AMOUNT (RS.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceToPrint.items.map((item: any, idx: number) => (
                      <tr key={idx} className="text-sm border-b border-[#CEBB8A] last:border-0">
                        <td className="p-6 text-center font-black border-r border-[#CEBB8A] text-[#6B5C42]">{idx + 1}</td>
                        <td className="p-6 font-black border-r border-[#CEBB8A] uppercase">{item.description}</td>
                        <td className="p-6 text-center font-bold border-r border-[#CEBB8A] text-[#6B5C42]">{item.hsn}</td>
                        <td className="p-6 text-center border-r border-[#CEBB8A]">
                          <p className="font-black text-lg leading-none">{item.qty}</p>
                          <p className="text-[10px] font-bold text-[#6B5C42] uppercase">{item.unit}</p>
                        </td>
                        <td className="p-6 text-right font-bold border-r border-[#CEBB8A] font-mono">{indianNumberFormat(item.rate)}</td>
                        <td className="p-6 text-center font-black border-r border-[#CEBB8A]">{item.gst}%</td>
                        <td className="p-6 text-right font-black text-lg font-mono">{indianNumberFormat(item.qty * item.rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Block from Screenshot */}
              <div className="flex justify-end mb-12">
                <div className="w-[400px] space-y-4">
                  <div className="flex justify-between text-[11px] font-bold px-4 uppercase tracking-[0.1em] text-[#6B5C42]"><span>SUBTOTAL (BEFORE GST)</span><span className="font-mono text-black text-sm">Rs. {indianNumberFormat(totals.subtotal)}</span></div>
                  <div className="flex justify-between text-[11px] font-bold px-4 uppercase tracking-[0.1em] text-[#6B5C42]"><span>CGST (9%)</span><span className="font-mono text-black text-sm">Rs. {indianNumberFormat(totals.cgst)}</span></div>
                  <div className="flex justify-between text-[11px] font-bold px-4 uppercase tracking-[0.1em] text-[#6B5C42]"><span>SGST (9%)</span><span className="font-mono text-black text-sm">Rs. {indianNumberFormat(totals.sgst)}</span></div>
                  <div className="flex justify-between text-[11px] font-bold px-4 uppercase tracking-[0.1em] text-[#A02818] border-b border-[#CEBB8A] pb-4"><span>TDS (SEC. 194C)</span><span className="font-mono text-sm">- Rs. {indianNumberFormat(totals.tds_amt)}</span></div>
                  
                  {/* Total Amount Pill from Screenshot */}
                  <div className="relative mt-8 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#C9A84C] to-[#FDFBF7] rounded-[3rem] blur opacity-25" />
                    <div className="relative bg-white border-l-[12px] border-[#C9A84C] rounded-[3rem] p-8 flex justify-between items-center shadow-xl">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6B5C42]">TOTAL AMOUNT PAYABLE</p>
                        <p className="text-4xl font-black tracking-tighter text-[#0C0A07]">Rs. {indianNumberFormat(totals.final)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount In Words from Screenshot */}
              <div className="rounded-[3rem] border border-[#CEBB8A] p-6 mb-12 flex items-center gap-8">
                <div className="flex flex-col shrink-0">
                  <span className="text-[10px] font-black text-[#6B5C42] uppercase tracking-[0.2em]">AMOUNT IN</span>
                  <span className="text-[10px] font-black text-[#6B5C42] uppercase tracking-[0.2em]">WORDS:</span>
                </div>
                <p className="text-sm font-black italic text-[#0C0A07] leading-relaxed uppercase">{numberToWords(totals.final)}</p>
              </div>

              {/* Bottom Details from Screenshot */}
              <div className="grid grid-cols-2 gap-16">
                <div className="rounded-[2.5rem] border border-[#CEBB8A] p-8 space-y-4 bg-[#FDFBF7]/50">
                  <h3 className="text-[11px] font-black text-[#6B5C42] uppercase tracking-[0.2em] mb-4">BANK DETAILS</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between"><span className="text-[#6B5C42] font-bold uppercase tracking-widest text-[9px]">Bank:</span><span className="font-black text-black uppercase">State Bank of India</span></div>
                    <div className="flex justify-between"><span className="text-[#6B5C42] font-bold uppercase tracking-widest text-[9px]">Account No.:</span><span className="font-black text-black font-mono">32XXXXXXXXXX51</span></div>
                    <div className="flex justify-between"><span className="text-[#6B5C42] font-bold uppercase tracking-widest text-[9px]">IFSC Code:</span><span className="font-black text-black font-mono">SBIN0001234</span></div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center pt-8 relative">
                  <div className="absolute top-0 right-12 opacity-30 -rotate-12 border-4 border-dashed border-[#CEBB8A] rounded-full p-4">
                    <p className="text-[10px] font-black text-[#6B5C42] uppercase text-center leading-tight">VERIFIED<br />AUDIT<br />2026</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-[1.5px] w-64 bg-black mx-auto mb-4" />
                    <p className="text-sm font-black text-[#0C0A07] uppercase tracking-[0.2em]">AUTHORISED SIGNATORY</p>
                    <p className="text-[10px] font-bold text-[#6B5C42] uppercase">FOR NALAKATH CONSTRUCTIONS PVT. LTD.</p>
                  </div>
                </div>
              </div>

              {/* Footer from Screenshot */}
              <div className="mt-20 flex justify-between items-end border-t border-[#CEBB8A] pt-6">
                <p className="text-[10px] font-black text-[#6B5C42] tracking-[0.3em] uppercase">NALAKATH CONSTRUCTIONS PVT. LTD.</p>
                <div className="flex gap-8 text-[9px] font-bold text-[#6B5C42] uppercase tracking-widest">
                  <span>AREECODE, MALAPPURAM</span>
                  <span>PAGE 1 OF 1</span>
                </div>
              </div>

              {/* Print Actions */}
              <div className="print:hidden flex gap-4 justify-end mt-12 pt-8 border-t border-zinc-100">
                <Button variant="outline" className="rounded-full px-10 h-14 font-black uppercase text-[11px] tracking-widest" onClick={() => setInvoiceToPrint(null)}>Discard Preview</Button>
                <Button className="rounded-full px-14 h-14 font-black uppercase text-[11px] tracking-widest gold-gradient text-black shadow-2xl hover:scale-105 transition-transform" onClick={() => window.print()}><Printer className="h-5 w-5 mr-2" /> Save PDF / Print</Button>
              </div>
            </Card>
          </div>
        );
      })()}

      <BottomNav />
    </div>
  );
}
