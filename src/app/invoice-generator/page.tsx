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

const DARK = "#0C0A07";
const GOLD = "#C9A84C";
const GOLD3 = "#F0E4B8";
const BORDER = "#CEBB8A";
const MID = "#6B5C42";

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
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            <header className="flex flex-col gap-2">
              <Badge variant="outline" className="w-fit rounded-full px-4 py-1 text-[9px] uppercase tracking-widest font-bold border-primary/40 text-primary bg-primary/5">
                EXECUTIVE FISCAL HUB
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase mt-2">Tax Invoice Hub</h1>
              <p className="text-muted-foreground text-sm">Professional billing engine for {activeDivision.name}.</p>
            </header>

            <Card className="glass border-white/5 p-8 rounded-[3rem]">
              <form onSubmit={handleGenerate} className="space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Invoice Metadata</h3>
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
                    <h3 className="text-sm font-black uppercase tracking-widest">Bill To</h3>
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
                      <h3 className="text-sm font-black uppercase tracking-widest">Line Items</h3>
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
                    <h3 className="text-sm font-black uppercase tracking-widest">Adjustments</h3>
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
            <Card className="w-full max-w-4xl bg-white text-[#0C0A07] overflow-hidden rounded-none print:shadow-none shadow-2xl relative animate-in zoom-in-95 duration-300 font-sans border-none pb-10">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 print:hidden h-10 w-10 bg-black/10 hover:bg-black/20 text-black rounded-full z-[110]" onClick={() => setInvoiceToPrint(null)}>
                <X className="h-5 w-5" />
              </Button>
              
              <div style={{ backgroundColor: DARK }} className="h-[108px] w-full relative flex items-center px-10">
                <div style={{ backgroundColor: GOLD }} className="absolute top-0 left-0 w-full h-1" />
                <div style={{ backgroundColor: GOLD }} className="absolute bottom-0 left-0 w-full h-0.5" />
                
                <div className="flex items-center gap-6">
                  <div style={{ borderColor: GOLD }} className="h-16 w-16 rounded-full border-2 flex items-center justify-center text-white font-black text-xl">NH</div>
                  <div>
                    <h1 style={{ color: GOLD }} className="text-2xl font-black tracking-tight uppercase">NALAKATH CONSTRUCTIONS PVT. LTD.</h1>
                    <p style={{ color: GOLD3 }} className="text-[10px] italic font-medium opacity-80">Building Trust. Building Kerala.</p>
                    <p className="text-[8px] text-white/60 mt-1 uppercase tracking-widest font-bold">Areecode, Malappuram, Kerala | GSTIN: 32XXXXXX1234Z5</p>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: GOLD }} className="h-8 w-full flex items-center justify-between px-10">
                <span className="text-sm font-black uppercase text-black">Tax Invoice</span>
                <span className="text-[9px] font-bold text-black/70 uppercase">Original for Recipient | CGST + SGST | Malappuram Jurisdiction</span>
              </div>

              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-10">
                  <div style={{ backgroundColor: '#FDFBF7', borderColor: BORDER }} className="border rounded-xl p-6 relative overflow-hidden">
                    <div style={{ backgroundColor: GOLD }} className="absolute top-0 left-0 w-full h-6 px-4 flex items-center">
                      <span className="text-[9px] font-black text-black uppercase">Invoice Details</span>
                    </div>
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-xs"><span style={{ color: MID }} className="font-bold uppercase tracking-widest text-[9px]">Invoice Number:</span><span className="font-black">{invoiceToPrint.inv_no}</span></div>
                      <div className="flex justify-between text-xs"><span style={{ color: MID }} className="font-bold uppercase tracking-widest text-[9px]">Invoice Date:</span><span className="font-black">{new Date(invoiceToPrint.inv_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                      <div className="flex justify-between text-xs"><span style={{ color: MID }} className="font-bold uppercase tracking-widest text-[9px]">Payment Terms:</span><span className="font-black">{invoiceToPrint.payment_terms}</span></div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#FDFBF7', borderColor: BORDER }} className="border rounded-xl p-6 relative overflow-hidden">
                    <div style={{ backgroundColor: GOLD }} className="absolute top-0 left-0 w-full h-6 px-4 flex items-center">
                      <span className="text-[9px] font-black text-black uppercase">Bill To</span>
                    </div>
                    <div className="mt-6">
                      <p className="text-sm font-black uppercase text-black mb-1">{invoiceToPrint.b_name}</p>
                      <p style={{ color: MID }} className="text-[10px] font-bold uppercase leading-relaxed">{invoiceToPrint.b_gstin || "NO ADDRESS RECORDED"}</p>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#181410' }} className="rounded-lg h-8 flex items-center px-4 gap-3">
                  <span style={{ color: '#DFC06A' }} className="text-[9px] font-black uppercase">Project:</span>
                  <span className="text-[10px] text-white/80 font-medium uppercase truncate">{invoiceToPrint.project_desc || invoiceToPrint.inv_no}</span>
                </div>

                <div style={{ borderColor: BORDER }} className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead style={{ backgroundColor: DARK }}>
                      <tr>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest border-r border-white/10">#</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest border-r border-white/10">Work Description</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">HSN/SAC</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">Qty</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-right border-r border-white/10">Rate (Rs.)</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">GST %</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-right">Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] font-medium">
                      {invoiceToPrint.items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-[#E0D4B0] last:border-0">
                          <td className="p-4 text-center border-r border-[#DDD0A8]">{idx + 1}</td>
                          <td className="p-4 uppercase border-r border-[#DDD0A8]">{item.description}</td>
                          <td className="p-4 text-center border-r border-[#DDD0A8] text-muted-foreground">{item.hsn}</td>
                          <td className="p-4 text-center border-r border-[#DDD0A8] font-black">{item.qty}</td>
                          <td className="p-4 text-right border-r border-[#DDD0A8] font-mono">{indianNumberFormat(item.rate)}</td>
                          <td className="p-4 text-center border-r border-[#DDD0A8]">{item.gst}%</td>
                          <td className="p-4 text-right font-black font-mono">{indianNumberFormat(item.qty * item.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-4">
                  <div className="w-[320px] space-y-2">
                    <div className="flex justify-between text-[10px] font-bold px-2 text-[#6B5C42]"><span>Subtotal (before GST)</span><span className="font-mono text-black">Rs. {indianNumberFormat(totals.subtotal)}</span></div>
                    <div className="flex justify-between text-[10px] font-bold px-2 text-[#6B5C42]"><span>CGST (9%)</span><span className="font-mono text-black">Rs. {indianNumberFormat(totals.cgst)}</span></div>
                    <div className="flex justify-between text-[10px] font-bold px-2 text-[#6B5C42]"><span>SGST (9%)</span><span className="font-mono text-black">Rs. {indianNumberFormat(totals.sgst)}</span></div>
                    <div className="flex justify-between text-[10px] font-bold px-2 text-[#A02818] border-b border-black/5 pb-2"><span>TDS (Sec. 194C)</span><span className="font-mono">- Rs. {indianNumberFormat(totals.tds_amt)}</span></div>
                    
                    <div style={{ backgroundColor: DARK }} className="relative mt-4 rounded-lg p-4 flex justify-between items-center shadow-xl">
                      <div className="space-y-0.5">
                        <p style={{ color: GOLD }} className="text-[8px] font-black uppercase tracking-[0.2em]">Total Amount Payable</p>
                        <p style={{ color: GOLD }} className="text-2xl font-black tracking-tight">Rs. {indianNumberFormat(totals.final)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: GOLD3, borderColor: BORDER }} className="border rounded-lg p-4 flex items-center gap-6">
                  <span className="text-[9px] font-black text-[#6B5C42] uppercase tracking-[0.1em] shrink-0">Amount in Words:</span>
                  <p className="text-[10px] font-black italic text-black leading-relaxed uppercase">{numberToWords(totals.final)}</p>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div style={{ borderColor: BORDER, backgroundColor: '#FDFBF7' }} className="border rounded-xl p-6 relative overflow-hidden text-[10px]">
                    <div style={{ backgroundColor: GOLD }} className="absolute top-0 left-0 w-full h-6 px-4 flex items-center">
                      <span className="text-[9px] font-black text-black uppercase">Bank Details</span>
                    </div>
                    <div className="mt-6 space-y-1.5">
                      <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase tracking-widest text-[8px]">Bank:</span><span className="font-black text-black uppercase">State Bank of India</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase tracking-widest text-[8px]">Account No.:</span><span className="font-black text-black font-mono">32XXXXXXXXXX51</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase tracking-widest text-[8px]">IFSC Code:</span><span className="font-black text-black font-mono">SBIN0001234</span></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-end">
                    <div className="text-center space-y-1">
                      <div className="h-[1px] w-48 bg-black mx-auto mb-2" />
                      <p className="text-[10px] font-black text-black uppercase tracking-[0.1em]">Authorised Signatory</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">For Nalakath Constructions Pvt. Ltd.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="print:hidden flex gap-4 justify-center mt-6 pt-6 border-t border-zinc-100">
                <Button variant="outline" className="rounded-full px-8 h-12 font-bold uppercase text-[10px] tracking-widest" onClick={() => setInvoiceToPrint(null)}>Discard Preview</Button>
                <Button className="rounded-full px-12 h-12 font-bold uppercase text-[10px] tracking-widest gold-gradient text-black shadow-xl" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Export to PDF</Button>
              </div>
            </Card>
          </div>
        );
      })()}

      <BottomNav />
    </div>
  );
}
