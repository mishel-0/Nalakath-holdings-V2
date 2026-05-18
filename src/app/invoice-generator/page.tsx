"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText, Plus, Trash2, Printer, ArrowLeft, Building2, User,
  Percent, PlusCircle, Landmark, ScrollText, Eye, Copy, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { fmt, toWords, calculateInvoiceTotals } from "@/lib/invoice-utils";
import { motion, AnimatePresence } from "framer-motion";

function GeneratorContent() {
  const sp = useSearchParams();
  const year = new Date().getFullYear();

  const [invNo, setInvNo] = useState(sp.get("inv") || `NH/${year}/001`);
  const [invDate, setInvDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split("T")[0]; });
  const [billToName, setBillToName] = useState(sp.get("client") || "");
  const [billToAddress, setBillToAddress] = useState("");
  const [billToGstin, setBillToGstin] = useState("");
  const [billToPoRef, setBillToPoRef] = useState("");
  const [billToAttn, setBillToAttn] = useState("");
  const [projectDesc, setProjectDesc] = useState(sp.get("desc") || "");
  const [projectRef, setProjectRef] = useState("");

  const [items, setItems] = useState([
    { id: Date.now(), description: "Site Mobilization & Preliminary Work", hsn: "9954", qty: 1, unit: "L.S.", rate: sp.get("amount") ? Number(sp.get("amount")) : 0, gst: 18 }
  ]);

  const [discPct, setDiscPct] = useState(0);
  const [tdsPct, setTdsPct] = useState(2);
  const [isCgstSgst, setIsCgstSgst] = useState(true);
  const [extraCharges, setExtraCharges] = useState(0);
  const [extraLabel, setExtraLabel] = useState("Extra Charges");
  const [jurisdiction, setJurisdiction] = useState("Malappuram");
  const [showPreview, setShowPreview] = useState(false);

  const t = calculateInvoiceTotals(items, discPct, tdsPct, isCgstSgst, extraCharges);
  const addItem = () => setItems([...items, { id: Date.now(), description: "", hsn: "9954", qty: 1, unit: "Cu.m", rate: 0, gst: 18 }]);
  const rmItem = (id: number) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)); };
  const updItem = (id: number, f: string, v: any) => setItems(items.map(i => i.id === id ? { ...i, [f]: v } : i));
  const fdate = (d: string) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "";

  const loadSample = () => {
    setInvNo("NH/2026/001"); setInvDate("2026-05-18"); setDueDate("2026-06-17");
    setBillToName("Kerala State Construction Board"); setBillToGstin("32YYYYYY5678Z6");
    setBillToPoRef("KSCB/PO/2025/0089"); setBillToAttn("Mr. Suresh Kumar, Project Manager");
    setBillToAddress("Civil Station Road\nMalappuram, Kerala 676505");
    setProjectDesc("Construction of Community Hall, Perinthalmanna, Malappuram");
    setProjectRef("PROJ-2025-011");
    setItems([
      { id: Date.now()+1, description: "Excavation & earthwork — foundation", hsn: "9954", qty: 450, unit: "Cu.m", rate: 185, gst: 18 },
      { id: Date.now()+2, description: "PCC M15 Grade concrete work", hsn: "9954", qty: 180, unit: "Cu.m", rate: 4200, gst: 18 },
      { id: Date.now()+3, description: "RCC M25 Grade — columns, beams & slabs", hsn: "9954", qty: 220, unit: "Cu.m", rate: 6800, gst: 18 },
    ]);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl min-h-screen">
      <AnimatePresence mode="wait">
        {!showPreview ? (
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Invoice Generator</h1>
                <p className="text-muted-foreground text-sm">Create invoices for Nalakath Holdings projects.</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={loadSample} variant="outline" className="rounded-full h-12 px-6 border-primary/20 text-primary font-bold">
                  <Copy className="w-4 h-4 mr-2" /> LOAD SAMPLE
                </Button>
                <Button onClick={() => setShowPreview(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-12 rounded-full shadow-lg shadow-primary/20">
                  <Eye className="w-4 h-4 mr-2" /> GENERATE PREVIEW
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Invoice Details */}
                <Card className="border-primary/20 glass">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                      <FileText className="w-4 h-4" /> Invoice Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <F label="Invoice Number" v={invNo} s={setInvNo} />
                    <F label="Invoice Date" type="date" v={invDate} s={setInvDate} />
                    <F label="Due Date" type="date" v={dueDate} s={setDueDate} />
                    <F label="Project Reference" placeholder="PROJ-2025-011" v={projectRef} s={setProjectRef} />
                    <F label="Payment Terms" v="Net 30 Days" ro />
                    <F label="Jurisdiction" v={jurisdiction} s={setJurisdiction} />
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Project Description</Label>
                      <Input placeholder="Construction of Community Hall..." value={projectDesc} onChange={e => setProjectDesc(e.target.value)}
                        className="bg-background/50 border-primary/20 h-11" />
                    </div>
                  </CardContent>
                </Card>

                {/* Bill To */}
                <Card className="border-primary/20 glass">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                      <User className="w-4 h-4" /> Bill To (Recipient)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <F label="Client / Organization" placeholder="Organization" v={billToName} s={setBillToName} />
                    <F label="Attn / Contact" placeholder="Mr. Name, Designation" v={billToAttn} s={setBillToAttn} />
                    <F label="GSTIN" placeholder="32XXXXXX1234Z5" v={billToGstin} s={setBillToGstin} />
                    <F label="PO Reference" placeholder="PO Ref" v={billToPoRef} s={setBillToPoRef} />
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Full Address</Label>
                      <Input placeholder="Street, City, State, PIN" value={billToAddress} onChange={e => setBillToAddress(e.target.value)}
                        className="bg-background/50 border-primary/20 h-11" />
                    </div>
                  </CardContent>
                </Card>

                {/* Line Items */}
                <Card className="border-primary/20 glass">
                  <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                      <PlusCircle className="w-4 h-4" /> Line Items
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={addItem} className="text-primary">
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-primary/5 text-[10px] uppercase font-bold text-muted-foreground border-b border-primary/10">
                        <tr>
                          <th className="px-3 py-3 w-8">#</th>
                          <th className="px-3 py-3 min-w-[200px]">Description of Work / Materials</th>
                          <th className="px-2 py-3 w-18">HSN/SAC</th>
                          <th className="px-2 py-3 w-14">Qty</th>
                          <th className="px-2 py-3 w-16">Unit</th>
                          <th className="px-2 py-3 w-26">Rate</th>
                          <th className="px-2 py-3 w-14">GST%</th>
                          <th className="px-2 py-3 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/10">
                        {items.map((item, idx) => (
                          <tr key={item.id} className="group hover:bg-primary/5 transition-colors">
                            <td className="px-3 py-2 text-xs text-muted-foreground font-bold text-center">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <Input value={item.description} onChange={e => updItem(item.id, "description", e.target.value)}
                                className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm" placeholder="Item description..." />
                            </td>
                            <td className="px-2 py-2"><Input value={item.hsn} onChange={e => updItem(item.id, "hsn", e.target.value)} className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center" /></td>
                            <td className="px-2 py-2"><Input type="number" value={item.qty} onChange={e => updItem(item.id, "qty", Number(e.target.value))} className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center" /></td>
                            <td className="px-2 py-2"><Input value={item.unit} onChange={e => updItem(item.id, "unit", e.target.value)} className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center" placeholder="Cu.m" /></td>
                            <td className="px-2 py-2"><Input type="number" value={item.rate} onChange={e => updItem(item.id, "rate", Number(e.target.value))} className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-right" /></td>
                            <td className="px-2 py-2"><Input type="number" value={item.gst} onChange={e => updItem(item.id, "gst", Number(e.target.value))} className="bg-transparent border-none focus:ring-0 px-0 h-8 text-sm text-center" /></td>
                            <td className="px-2 py-2 text-center">
                              <Button variant="ghost" size="icon" onClick={() => rmItem(item.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Settings */}
              <div className="space-y-8">
                <Card className="border-primary/20 glass sticky top-24">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                      <Settings2 className="w-4 h-4" /> Adjustments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Discount %</Label><Input type="number" value={discPct} onChange={e => setDiscPct(Number(e.target.value))} className="bg-background/50 border-primary/20" /></div>
                      <div className="space-y-2"><Label className="text-xs uppercase font-bold text-muted-foreground">TDS %</Label><Input type="number" value={tdsPct} onChange={e => setTdsPct(Number(e.target.value))} className="bg-background/50 border-primary/20" /></div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">GST Type</Label>
                      <div className="flex bg-primary/10 p-1 rounded-lg">
                        <button onClick={() => setIsCgstSgst(true)} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${isCgstSgst ? "bg-primary text-primary-foreground" : "text-primary/60"}`}>LOCAL (CGST+SGST)</button>
                        <button onClick={() => setIsCgstSgst(false)} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${!isCgstSgst ? "bg-primary text-primary-foreground" : "text-primary/60"}`}>IGST</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Extra Charges</Label><Input type="number" value={extraCharges} onChange={e => setExtraCharges(Number(e.target.value))} className="bg-background/50 border-primary/20" /></div>
                      <div className="space-y-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Label</Label><Input value={extraLabel} onChange={e => setExtraLabel(e.target.value)} className="bg-background/50 border-primary/20" /></div>
                    </div>
                    <Separator className="bg-primary/20" />
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal (before GST)</span><span className="font-medium">Rs. {fmt(t.subtotal)}</span></div>
                      {t.discAmt > 0 && <div className="flex justify-between text-sm text-red-500"><span>Discount ({discPct}%)</span><span>- Rs. {fmt(t.discAmt)}</span></div>}
                      {isCgstSgst ? <><div className="flex justify-between text-sm"><span className="text-muted-foreground">CGST</span><span className="font-medium">Rs. {fmt(t.cgst)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">SGST</span><span className="font-medium">Rs. {fmt(t.sgst)}</span></div></> : <div className="flex justify-between text-sm"><span className="text-muted-foreground">IGST</span><span className="font-medium">Rs. {fmt(t.igst)}</span></div>}
                      {t.tdsAmt > 0 && <div className="flex justify-between text-sm text-red-500"><span>TDS ({tdsPct}% Sec. 194C)</span><span>- Rs. {fmt(t.tdsAmt)}</span></div>}
                      {extraCharges > 0 && <div className="flex justify-between text-sm"><span>{extraLabel}</span><span>Rs. {fmt(extraCharges)}</span></div>}
                      <Separator className="bg-primary/20" />
                      <div className="flex justify-between items-end pt-1">
                        <span className="text-base font-bold uppercase tracking-tighter">Total Payable</span>
                        <span className="text-2xl font-black text-primary">Rs. {fmt(t.final)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8 py-8">

            {/* ── Controls ── */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 bg-black/80 backdrop-blur-xl p-4 rounded-full border border-primary/30 shadow-2xl z-50 print:hidden">
              <Button variant="ghost" onClick={() => setShowPreview(false)} className="rounded-full h-12 px-6 font-bold text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" /> EDIT
              </Button>
              <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90 text-black font-bold h-12 px-8 rounded-full shadow-lg shadow-primary/30">
                <Printer className="w-4 h-4 mr-2" /> SAVE AS PDF
              </Button>
            </div>

            {/* ═══════════════════════════════════════════════════════
               A4 INVOICE — Pure Tailwind, no custom CSS
            ═══════════════════════════════════════════════════════ */}
            <div id="invoice-document" className="w-full max-w-[210mm] bg-white text-black shadow-2xl font-sans relative overflow-hidden flex flex-col print:shadow-none print:w-[210mm] print:min-h-[297mm] print:absolute print:left-0 print:top-0 print:m-0 print:p-0">

              {/* ── HEADER ── */}
              <div className="bg-zinc-950 px-8 pt-8 pb-6 flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <Building2 className="w-6 h-6 text-zinc-950" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-primary leading-none">NALAKATH HOLDINGS</h1>
                    <p className="text-[7px] text-primary/70 uppercase tracking-[0.2em] mt-1.5 font-bold italic">Building Trust. Building Kerala.</p>
                    <p className="text-[7px] text-zinc-500 leading-relaxed mt-3">Nalakath Hub, Ward No. 4, Areecode, Malappuram, Kerala 673639</p>
                    <p className="text-[7px] text-zinc-500">+91 97444 00100 &nbsp;|&nbsp; info@nalakathindia.com &nbsp;|&nbsp; GSTIN: 32XXXXXX1234Z5</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[6.5px] text-primary font-bold uppercase tracking-widest opacity-50 mb-1">Corporate Identification</p>
                  <p className="text-[7px] text-zinc-500 font-mono">GSTIN: 32XXXXXX1234Z5</p>
                  <p className="text-[7px] text-zinc-500 font-mono">CIN: U45200KL2013PTC034078</p>
                </div>
              </div>

              {/* ── TITLE BAND ── */}
              <div className="bg-primary px-8 py-3 flex justify-between items-center">
                <h2 className="text-base font-black tracking-[0.2em] text-zinc-950 uppercase">Invoice</h2>
                <div className="text-[7px] font-bold text-zinc-950/70 flex gap-2 uppercase tracking-wider items-center">
                  <span>Original for Recipient</span>
                  <span className="opacity-40">|</span>
                  <span>{isCgstSgst ? "CGST + SGST (Local)" : "IGST (Inter-state)"}</span>
                  <span className="opacity-40">|</span>
                  <span>{jurisdiction} Jurisdiction</span>
                </div>
              </div>

              {/* ── META SECTION: Details + Bill To ── */}
              <div className="grid grid-cols-2 gap-5 px-8 pt-6 pb-3">
                {/* Invoice Details */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200">
                    <p className="text-[7.5px] font-black uppercase tracking-widest text-zinc-500">Invoice Details</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <MR label="Invoice Number" value={invNo} />
                    <MR label="Invoice Date" value={fdate(invDate)} />
                    <MR label="Due Date" value={fdate(dueDate)} />
                    <MR label="Payment Terms" value="Net 30 Days" />
                    {projectRef && <MR label="Project Ref" value={projectRef} />}
                  </div>
                </div>
                {/* Bill To */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200">
                    <p className="text-[7.5px] font-black uppercase tracking-widest text-zinc-500">Bill To</p>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <p className="text-[10px] font-black text-zinc-900 uppercase leading-tight">{billToName || "____________________"}</p>
                    {billToAttn && <p className="text-[7.5px] text-zinc-500">Attn: {billToAttn}</p>}
                    <p className="text-[7.5px] text-zinc-600 whitespace-pre-line leading-snug">{billToAddress || "____________________"}</p>
                    {billToGstin && <p className="text-[7.5px] font-bold text-zinc-500 font-mono mt-1">GSTIN: {billToGstin}</p>}
                    {billToPoRef && <p className="text-[7.5px] font-bold text-zinc-500 font-mono">PO Ref: {billToPoRef}</p>}
                  </div>
                </div>
              </div>

              {/* ── PROJECT BAR ── */}
              {projectDesc && (
                <div className="mx-8 bg-zinc-950 py-2.5 px-5 rounded-lg flex items-center gap-3 border border-zinc-800 mb-3">
                  <span className="text-[7px] font-black text-primary uppercase tracking-widest shrink-0">Project:</span>
                  <span className="text-[8.5px] text-zinc-300 font-bold truncate">{projectDesc}</span>
                </div>
              )}

              {/* ── ITEMS TABLE ── */}
              <div className="px-8 flex-1 pb-2">
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[7.5px] uppercase font-black tracking-wider border-b border-zinc-200">
                        <th className="px-3 py-3 w-8 text-center text-primary">#</th>
                        <th className="px-3 py-3 text-primary">Description of Work / Materials</th>
                        <th className="px-3 py-3 w-20 text-center text-primary">HSN/SAC</th>
                        <th className="px-3 py-3 w-14 text-center text-primary">Qty</th>
                        <th className="px-3 py-3 w-16 text-center text-primary">Unit</th>
                        <th className="px-3 py-3 w-28 text-right text-primary">Rate (Rs.)</th>
                        <th className="px-3 py-3 w-14 text-center text-primary">GST %</th>
                        <th className="px-3 py-3 w-32 text-right text-primary">Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {items.map((item, idx) => (
                        <tr key={item.id} className="text-[8.5px]">
                          <td className="px-3 py-3 text-center text-zinc-400 font-bold">{idx + 1}</td>
                          <td className="px-3 py-3 font-bold text-zinc-800">{item.description}</td>
                          <td className="px-3 py-3 text-center text-zinc-500 font-mono">{item.hsn}</td>
                          <td className="px-3 py-3 text-center font-black">{item.qty}</td>
                          <td className="px-3 py-3 text-center text-zinc-500 font-medium">{item.unit}</td>
                          <td className="px-3 py-3 text-right font-medium">{fmt(item.rate)}</td>
                          <td className="px-3 py-3 text-center text-zinc-500">{item.gst}%</td>
                          <td className="px-3 py-3 text-right font-black text-zinc-900">{fmt(item.qty * item.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── BOTTOM: Two Columns ── */}
              <div className="grid grid-cols-2 gap-6 px-8 pt-3 pb-6">
                {/* LEFT COLUMN */}
                <div className="space-y-4">
                  {/* Amount in Words */}
                  <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-100/80 flex gap-3 items-start">
                    <ScrollText className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[6.5px] font-black uppercase text-amber-800/60 tracking-widest">Amount in Words:</p>
                      <p className="text-[8px] font-bold italic text-zinc-800 leading-snug mt-0.5">{toWords(t.final)}</p>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200 flex items-center gap-2">
                      <Landmark className="w-3 h-3 text-zinc-500" />
                      <span className="text-[6.5px] font-black uppercase tracking-widest text-zinc-500">Bank Details</span>
                    </div>
                    <div className="p-4 space-y-1.5">
                      {[
                        ["Bank:", "State Bank of India, Perinthalmanna"],
                        ["Account Name:", "NALAKATH HOLDINGS"],
                        ["Account No.:", "32XXXXXXXXXX51"],
                        ["IFSC Code:", "SBIN0001234"],
                        ["Account Type:", "Current Account"],
                      ].map(([l, v]) => (
                        <div key={l} className="flex justify-between text-[7px] items-center">
                          <span className="text-zinc-500 uppercase font-bold tracking-wider text-[6.5px]">{l}</span>
                          <span className="font-black text-zinc-900 font-mono text-[7px]">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Declaration */}
                  <p className="text-[6px] text-zinc-400 italic leading-relaxed border-l-2 border-zinc-200 pl-3">
                    We declare that this invoice shows the actual price of the goods / services described and that all particulars are true and correct to the best of our knowledge.
                  </p>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-3">
                  {/* Tax Breakdown */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[8px] items-center py-1">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider text-[7px]">Subtotal (before GST)</span>
                      <span className="font-black text-zinc-900">Rs. {fmt(t.subtotal)}</span>
                    </div>
                    {t.discAmt > 0 && (
                      <div className="flex justify-between text-[8px] items-center py-1 text-red-600 border-t border-zinc-100">
                        <span className="font-bold uppercase tracking-wider text-[7px]">Discount ({discPct}%)</span>
                        <span className="font-black">- Rs. {fmt(t.discAmt)}</span>
                      </div>
                    )}
                    {isCgstSgst ? (
                      <>
                        <div className="flex justify-between text-[8px] items-center py-1 border-t border-zinc-100">
                          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[7px]">CGST ({(items[0]?.gst ?? 18) / 2}%)</span>
                          <span className="font-black text-zinc-900">Rs. {fmt(t.cgst)}</span>
                        </div>
                        <div className="flex justify-between text-[8px] items-center py-1">
                          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[7px]">SGST ({(items[0]?.gst ?? 18) / 2}%)</span>
                          <span className="font-black text-zinc-900">Rs. {fmt(t.sgst)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-[8px] items-center py-1 border-t border-zinc-100">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider text-[7px]">IGST</span>
                        <span className="font-black text-zinc-900">Rs. {fmt(t.igst)}</span>
                      </div>
                    )}
                    {extraCharges > 0 && (
                      <div className="flex justify-between text-[8px] items-center py-1 border-t border-zinc-100">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider text-[7px]">{extraLabel}</span>
                        <span className="font-black text-zinc-900">Rs. {fmt(extraCharges)}</span>
                      </div>
                    )}
                    {t.tdsAmt > 0 && (
                      <div className="flex justify-between text-[8px] items-center py-1 text-red-600 border-t border-zinc-100">
                        <span className="font-bold uppercase tracking-wider text-[7px]">TDS Deductible ({tdsPct}% Sec. 194C)</span>
                        <span className="font-black">- Rs. {fmt(t.tdsAmt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Total Amount */}
                  <div className="bg-zinc-950 rounded-2xl p-4 text-center relative overflow-hidden">
                    <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-primary/10 rounded-full" />
                    <div className="relative">
                      <span className="text-[7px] font-black uppercase tracking-[0.3em] text-primary/60 mb-0.5 block">Total Amount Payable</span>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-base font-black text-white/50">Rs.</span>
                        <span className="text-[28px] font-black tracking-tighter text-primary">{fmt(t.final)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Terms + Signature */}
                  <div className="flex justify-between items-end pt-1">
                    <div className="text-[6px] text-zinc-400 space-y-0.5 leading-relaxed max-w-[140px]">
                      <p className="text-[7px] font-black text-zinc-500 uppercase tracking-wider mb-0.5">Terms & Conditions</p>
                      <p>1. Payment due within 30 days of invoice date.</p>
                      <p>2. Interest @ 18% p.a. on overdue amounts.</p>
                      <p>3. Disputes subject to Malappuram jurisdiction.</p>
                      <p>4. This is a computer-generated invoice.</p>
                    </div>
                    <div className="flex flex-col items-center text-center shrink-0">
                      <div className="w-12 h-12 border-2 border-zinc-200 rounded-full flex items-center justify-center relative opacity-40 mb-1">
                        <div className="absolute inset-1.5 border border-zinc-200 rounded-full border-dashed" />
                        <div className="text-[4.5px] font-black text-primary text-center uppercase leading-tight">Nalakath<br />Holdings<br />Malappuram</div>
                      </div>
                      <div className="w-28 h-px bg-zinc-900 mb-0.5" />
                      <p className="text-[8px] font-black uppercase tracking-wider text-zinc-900">Authorised Signatory</p>
                      <p className="text-[6.5px] font-bold text-zinc-400 uppercase tracking-wider">For Nalakath Holdings</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── FOOTER ── */}
              <div className="bg-zinc-950 py-3 px-8 flex justify-between items-center border-t-2 border-primary mt-auto">
                <div className="flex gap-3 items-center flex-wrap">
                  <span className="text-[6.5px] font-black text-white/80 uppercase tracking-wider">Nalakath Holdings</span>
                  <span className="w-0.5 h-0.5 bg-primary/50 rounded-full" />
                  <span className="text-[6.5px] font-bold text-white/40">Nalakath Hub, Areecode, Malappuram</span>
                  <span className="w-0.5 h-0.5 bg-primary/50 rounded-full" />
                  <span className="text-[6.5px] font-bold text-white/40">+91 97444 00100</span>
                  <span className="w-0.5 h-0.5 bg-primary/50 rounded-full" />
                  <span className="text-[6.5px] font-bold text-white/40">nalakathindia.com</span>
                </div>
                <span className="text-[6.5px] font-black text-primary/60 uppercase">Page 1 of 1</span>
              </div>

              {/* ── WATERMARK ── */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.012] rotate-[-30deg]">
                <Building2 className="w-52 h-52 text-zinc-900" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Print styles (only) ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-document, #invoice-document * { visibility: visible !important; }
          #invoice-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
          }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Helpers ──
function F({ label, v, s, type = "text", placeholder, ro }: { label: string; v: string; s?: (v: string) => void; type?: string; placeholder?: string; ro?: boolean }) {
  return <div className="space-y-2">
    <Label className="text-xs uppercase font-bold text-muted-foreground">{label}</Label>
    <Input type={type} value={v} readOnly={ro} placeholder={placeholder} onChange={e => s?.(e.target.value)} className="bg-background/50 border-primary/20 h-11" />
  </div>;
}

function MR({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-[7.5px] items-center">
    <span className="text-zinc-500 font-medium">{label}:</span>
    <span className="font-bold text-zinc-900">{value}</span>
  </div>;
}

export default function InvoiceGeneratorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen font-black text-primary animate-pulse uppercase tracking-[0.5em]">Loading Invoice Engine...</div>
    }>
      <GeneratorContent />
    </Suspense>
  );
}
