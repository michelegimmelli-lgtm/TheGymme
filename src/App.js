 import { useState } from "react";

const KG_TO_KCAL = 7700;

const activityLevels = [
  { label: "Sedentario (poco o nessun esercizio)", factor: 1.2 },
  { label: "Leggero (1-3 giorni/sett.)", factor: 1.375 },
  { label: "Moderato (3-5 giorni/sett.)", factor: 1.55 },
  { label: "Attivo (6-7 giorni/sett.)", factor: 1.725 },
  { label: "Molto attivo (lavoro fisico + sport)", factor: 1.9 },
];

const deficits = [
  { label: "Lieve", kcal: 250, rate: "~0.25 kg/sett.", color: "#059669" },
  { label: "Moderato", kcal: 500, rate: "~0.5 kg/sett.", color: "#D97706" },
  { label: "Aggressivo", kcal: 750, rate: "~0.75 kg/sett.", color: "#DC2626" },
];

function calcBMR(w, h, a, sex) {
  return sex === "M" ? 10*w + 6.25*h - 5*a + 5 : 10*w + 6.25*h - 5*a - 161;
}
function calcBodyFat(sex, height, waist, neck, hips) {
  if (sex === "M") return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  return 495 / (1.29579 - 0.35004 * Math.log10(waist + hips - neck) + 0.22100 * Math.log10(height)) - 450;
}
function getBFCategory(sex, bf) {
  if (sex === "M") {
    if (bf < 6)  return { label: "Grasso essenziale", color: "#3B82F6" };
    if (bf < 14) return { label: "Atleta", color: "#059669" };
    if (bf < 18) return { label: "Fitness", color: "#10B981" };
    if (bf < 25) return { label: "Nella media", color: "#D97706" };
    return       { label: "Obesità", color: "#DC2626" };
  }
  if (bf < 14) return { label: "Grasso essenziale", color: "#3B82F6" };
  if (bf < 21) return { label: "Atleta", color: "#059669" };
  if (bf < 25) return { label: "Fitness", color: "#10B981" };
  if (bf < 32) return { label: "Nella media", color: "#D97706" };
  return       { label: "Obesità", color: "#DC2626" };
}
function getBMIInfo(bmi) {
  if (bmi < 18.5) return { label: "Sottopeso", color: "#3B82F6" };
  if (bmi < 25)   return { label: "Normopeso", color: "#059669" };
  if (bmi < 30)   return { label: "Sovrappeso", color: "#D97706" };
  return           { label: "Obesità", color: "#DC2626" };
}

const iStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 15, outline: "none", boxSizing: "border-box", background: "#F9FAFB" };
const lStyle = { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" };

function KpiCard({ label, value, sub, color, note }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "14px 10px", textAlign: "center", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", borderTop: "4px solid " + color }}>
      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{sub}</div>
      {note && <div style={{ fontSize: 10, color: "#F59E0B", marginTop: 4, fontWeight: 600 }}>{note}</div>}
    </div>
  );
}

function ActivityRows({ items }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
      {items.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F9FAFB", borderRadius: 10, padding: "12px 14px", borderLeft: "4px solid " + r.color }}>
          <div>
            <div style={{ fontWeight: 700, color: r.color, fontSize: 14 }}>{r.emoji} {r.periodo}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{r.note}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{r.km} km</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>al giorno</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BigBox({ color, km, mode }) {
  return (
    <div style={{ background: mode === "run" ? "#EEF2FF" : "#F0FDF4", borderRadius: 12, padding: 16, textAlign: "center", marginBottom: 14 }}>
      <div style={{ fontSize: 13, color, fontWeight: 600, marginBottom: 4 }}>KM TOTALI PER BRUCIARE 1 KG DI</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: "#DC2626", letterSpacing: 2, marginBottom: 6 }}>GRASSO</div>
      <div style={{ fontSize: 13, color, fontWeight: 600, marginBottom: 8 }}>{mode === "run" ? "🏃‍♂️ CORRENDO" : "🚶 CAMMINANDO"}</div>
      <div style={{ fontSize: 44, fontWeight: 900, color, lineHeight: 1 }}>{km}</div>
      <div style={{ fontSize: 13, color, marginTop: 4 }}>km complessivi</div>
    </div>
  );
}

function SimulatoreBlock({ result }) {
  const [targetBf, setTargetBf] = useState("");
  const [sim, setSim] = useState(null);

  const currentBf = result.bf;
  const currentWeight = result.weight;
  const leanKg = result.leanKg;

  const runSim = () => {
    const t = parseFloat(targetBf);
    if (!t || t <= 0 || t >= 100) return;
    if (t >= currentBf) { setSim({ error: true }); return; }
    const weightTarget = leanKg / (1 - t / 100);
    const fatLost = currentWeight - weightTarget;
    const fatKgTarget = leanKg * (t / (100 - t));
    const leanPctTarget = 100 - t;
    const kcalToLose = fatLost * KG_TO_KCAL;
    const weeksModerate = kcalToLose / (500 * 7);
    const weeksLieve = kcalToLose / (250 * 7);
    const kcalPerKm = 0.8 * currentWeight;
    const kcalPerKmWalk = 0.5 * currentWeight;
    setSim({ weightTarget: weightTarget.toFixed(1), fatLost: fatLost.toFixed(1), fatKgTarget: fatKgTarget.toFixed(1), leanPctTarget, weeksModerate: weeksModerate.toFixed(1), weeksLieve: weeksLieve.toFixed(1), kcalToLose: Math.round(kcalToLose), kmRun: Math.round(kcalToLose / kcalPerKm), kmWalk: Math.round(kcalToLose / kcalPerKmWalk), error: false });
  };

  const bfCat = sim && !sim.error ? getBFCategory(result.sex, parseFloat(targetBf)) : null;

  return (
    <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: 18, marginBottom: 14 }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>🎯 Simula il tuo dimagrimento</h3>
      <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280" }}>
        La tua massa magra attuale (<strong>{result.leanKg.toFixed(1)} kg</strong>) rimane costante: perdi solo grasso.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{ background: "#F3F4F6", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>Peso attuale</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>{currentWeight} kg</div>
        </div>
        <div style={{ background: "#FEF2F2", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 600, textTransform: "uppercase" }}>Grasso attuale (kg)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#DC2626" }}>{result.fatKg.toFixed(1)} kg</div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>{result.bf.toFixed(1)}% del corpo</div>
        </div>
        <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#059669", fontWeight: 600, textTransform: "uppercase" }}>Massa magra</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>{result.leanKg.toFixed(1)} kg</div>
        </div>
      </div>
      <label style={lStyle}>% grasso obiettivo</label>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <input style={{ ...iStyle, flex: 1 }} type="number" min="4" max={currentBf - 0.1} step="0.5"
          placeholder={`Es. ${Math.max(4, Math.round(currentBf - 5))}`}
          value={targetBf} onChange={e => { setTargetBf(e.target.value); setSim(null); }} />
        <button onClick={runSim} style={{ padding: "10px 20px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}>Simula →</button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {(result.sex === "M" ? [6, 10, 12, 15] : [14, 18, 22, 25]).filter(v => v < currentBf).map(v => (
          <button key={v} onClick={() => { setTargetBf(String(v)); setSim(null); }} style={{
            padding: "4px 12px", borderRadius: 20, border: "1px solid #D1D5DB",
            background: Number(targetBf) === v ? "#4F46E5" : "#F9FAFB",
            color: Number(targetBf) === v ? "#fff" : "#374151", fontSize: 12, cursor: "pointer", fontWeight: 600
          }}>{v}%</button>
        ))}
      </div>
      {sim?.error && (
        <div style={{ background: "#FEF2F2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#DC2626" }}>
          ⚠️ L'obiettivo deve essere inferiore alla tua percentuale attuale ({currentBf.toFixed(1)}%).
        </div>
      )}
      {sim && !sim.error && (
        <div>
          <div style={{ background: "linear-gradient(135deg, #EEF2FF, #F0FDF4)", borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Oggi</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#111827" }}>{currentWeight} kg</div>
                <div style={{ fontSize: 13, color: "#DC2626", fontWeight: 700 }}>{currentBf.toFixed(1)}% grasso</div>
                <div style={{ fontSize: 13, color: "#059669", fontWeight: 700 }}>{(100 - currentBf).toFixed(1)}% magro</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28 }}>→</div>
                <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 700, background: "#FEF2F2", borderRadius: 6, padding: "2px 8px", marginTop: 4 }}>-{sim.fatLost} kg grasso</div>
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Obiettivo</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#4F46E5" }}>{sim.weightTarget} kg</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: bfCat.color }}>{targetBf}% grasso</div>
                <div style={{ fontSize: 13, color: "#059669", fontWeight: 700 }}>{sim.leanPctTarget.toFixed(1)}% magro</div>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            <KpiCard label="Peso obiettivo" value={sim.weightTarget + " kg"} sub="stima" color="#4F46E5" />
            <KpiCard label="Grasso (kg)" value={sim.fatKgTarget + " kg"} sub={`${targetBf}% del corpo`} color={bfCat.color} />
            <KpiCard label="Categoria BF" value={bfCat.label} sub="per il sesso selezionato" color={bfCat.color} />
          </div>
          <h4 style={{ margin: "0 0 10px", fontSize: 14 }}>⏱️ Tempo stimato con deficit alimentare</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Deficit lieve", kcal: 250, weeks: sim.weeksLieve, color: "#059669", rate: "~0.25 kg/sett." },
              { label: "Deficit moderato", kcal: 500, weeks: sim.weeksModerate, color: "#D97706", rate: "~0.5 kg/sett." },
            ].map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F9FAFB", borderRadius: 10, padding: "12px 14px", borderLeft: "4px solid " + d.color }}>
                <div>
                  <div style={{ fontWeight: 700, color: d.color, fontSize: 14 }}>{d.label} (-{d.kcal} kcal/die)</div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{d.rate} → {Math.ceil(parseFloat(d.weeks))} settimane = ~{Math.round(Math.ceil(parseFloat(d.weeks)) / 4.3)} mesi</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{d.weeks} sett.</div>
                </div>
              </div>
            ))}
          </div>
          <h4 style={{ margin: "0 0 10px", fontSize: 14 }}>🏃 Km totali per raggiungere l'obiettivo (solo sport)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { label: "🏃‍♂️ Correndo", km: sim.kmRun, color: "#4F46E5", bg: "#EEF2FF" },
              { label: "🚶 Camminando", km: sim.kmWalk, color: "#059669", bg: "#F0FDF4" },
            ].map((c, i) => (
              <div key={i} style={{ background: c.bg, borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: c.color, fontWeight: 700, marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 38, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.km}</div>
                <div style={{ fontSize: 12, color: c.color, marginTop: 4 }}>km totali</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#F3F4F6", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#374151", marginBottom: 10 }}>
            <strong>Deficit calorico totale necessario:</strong> {sim.kcalToLose.toLocaleString("it-IT")} kcal
            <span style={{ color: "#6B7280" }}> ({sim.fatLost} kg × 7.700 kcal/kg)</span>
          </div>
          <div style={{ background: "#FFFBEB", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#78350F" }}>
            <strong>⚠️ Nota:</strong> La simulazione assume perdita di solo grasso con massa magra costante. Combina deficit alimentare + attività fisica per risultati ottimali.
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [form, setForm] = useState({ weight: "", height: "", age: "", sex: "M", activity: 0, waist: "", neck: "", hips: "" });
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("calorie");
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calculate = () => {
    const w = parseFloat(form.weight), h = parseFloat(form.height), a = parseInt(form.age);
    if (!w || !h || !a || w <= 0 || h <= 0 || a <= 0) return;
    const bmr = calcBMR(w, h, a, form.sex);
    const tdee = bmr * activityLevels[form.activity].factor;
    const bmi = w / Math.pow(h / 100, 2);
    const kcalPerKm = 0.8 * w, kmFor1kg = KG_TO_KCAL / kcalPerKm;
    const kcalPerKmWalk = 0.5 * w, kmFor1kgWalk = KG_TO_KCAL / kcalPerKmWalk;
    let bf = null, fatKg = null, leanKg = null;
    const waist = parseFloat(form.waist), neck = parseFloat(form.neck), hips = parseFloat(form.hips);
    const hasHips = form.sex === "F" ? !!hips : true;
    if (waist && neck && hasHips && waist > neck) {
      const raw = calcBodyFat(form.sex, h, waist, neck, form.sex === "F" ? hips : 0);
      if (raw > 0 && raw < 70) {
        bf = raw;
        fatKg = (raw / 100) * w;
        leanKg = w - fatKg;
      }
    }
    setResult({ bmr: Math.round(bmr), tdee: Math.round(tdee), bmi: bmi.toFixed(1), kcalPerKm: Math.round(kcalPerKm), kmFor1kg: Math.round(kmFor1kg), kmPerDay1: +(kmFor1kg).toFixed(1), kmPerDay7: +(kmFor1kg / 7).toFixed(1), kmPerDay14: +(kmFor1kg / 14).toFixed(1), kcalPerKmWalk: Math.round(kcalPerKmWalk), kmFor1kgWalk: Math.round(kmFor1kgWalk), kmPerDay1Walk: +(kmFor1kgWalk).toFixed(1), kmPerDay7Walk: +(kmFor1kgWalk / 7).toFixed(1), kmPerDay14Walk: +(kmFor1kgWalk / 14).toFixed(1), bf, fatKg, leanKg, sex: form.sex, weight: w });
    setTab("calorie");
  };

  const tabs = [["calorie","🥗 Deficit"],["running","🔥 Brucia 1kg 🏃‍♂️"],["walking","🚶 Brucia 1kg"]];

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 560, margin: "0 auto", padding: 20 }}>

      {/* Guida utilizzo */}
      {showGuide && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 480, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>📖 Guida all'utilizzo</h2>
              <button onClick={() => setShowGuide(false)} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700, fontSize: 16, color: "#374151" }}>✕</button>
            </div>
            {[
              { bg: "#EEF2FF", col: "#4F46E5", title: "📋 1. Come inserire i dati", items: [
                ["Peso (kg)", "Inserisci il tuo peso corporeo attuale, es. 95.5. Usa il punto come separatore decimale."],
                ["Altezza (cm)", "Inserisci la tua altezza in centimetri, es. 178."],
                ["Età", "Inserisci la tua età in anni interi."],
                ["Sesso biologico", "Seleziona Uomo o Donna. Influisce sulla formula del BMR e sui range di massa grassa."],
                ["Livello di attività", "Scegli il livello che descrive meglio la tua settimana tipo."],
              ]},
              { bg: "#FEF2F2", col: "#DC2626", title: "📏 2. Come misurare vita, collo e fianchi", intro: "Usa un metro da sarto sulla pelle, non sopra i vestiti. Misura al mattino a digiuno e ripeti 2-3 volte usando la media.", items: [
                ["Vita (uomo)", "All'altezza dell'ombelico, in posizione rilassata."],
                ["Vita (donna)", "Nel punto più stretto del busto, sopra l'ombelico."],
                ["Collo", "Appena sotto il pomo d'Adamo, metro orizzontale."],
                ["Fianchi (solo donne)", "Nel punto più largo dei fianchi/glutei."],
              ]},
              { bg: "#F0FDF4", col: "#059669", title: "📊 3. Come leggere i risultati", items: [
                ["BMR", "Calorie bruciate a riposo assoluto. È la base di partenza."],
                ["TDEE", "Fabbisogno calorico reale giornaliero. Mangiare meno crea un deficit."],
                ["BMI", "Indice matematico orientativo: non distingue muscolo da grasso."],
                ["% Massa grassa", "Calcolata con metodo US Navy. Margine di errore ±3-4%."],
                ["Massa magra", "Muscoli, ossa, organi, acqua. È la costante usata nel simulatore."],
                ["Deficit calorico", "Quante kcal in meno rispetto al TDEE per perdere peso."],
              ]},
              { bg: "#EEF2FF", col: "#4F46E5", title: "🎯 4. Come usare il Simulatore Dimagrimento", intro: "Visibile solo dopo aver calcolato la composizione corporea (servono vita e collo).", items: [
                ["Inserisci il % grasso obiettivo", "Digita la percentuale target o usa i tasti rapidi."],
                ["Premi 'Simula →'", "Calcola il peso di arrivo mantenendo costante la massa magra."],
                ["Leggi i risultati", "Peso obiettivo, kg da perdere, settimane stimate, km di corsa/camminata."],
                ["Formula usata", "Peso obiettivo = Massa magra ÷ (1 - % grasso target / 100)."],
              ]},
            ].map((sec, si) => (
              <div key={si} style={{ marginBottom: 20 }}>
                <div style={{ background: sec.bg, borderRadius: 10, padding: "8px 14px", fontWeight: 700, color: sec.col, fontSize: 14, marginBottom: 10 }}>{sec.title}</div>
                {sec.intro && <p style={{ fontSize: 13, color: "#374151", margin: "0 0 10px", lineHeight: 1.6 }}>{sec.intro}</p>}
                {sec.items.map(([t, d]) => (
                  <div key={t} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>• {t}</div>
                    <div style={{ fontSize: 13, color: "#6B7280", marginLeft: 10 }}>{d}</div>
                  </div>
                ))}
              </div>
            ))}
            <button onClick={() => setShowGuide(false)} style={{ width: "100%", padding: "13px 0", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>✅ Chiudi guida</button>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {showDisclaimer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 420, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>⚠️</div>
            <h2 style={{ margin: "0 0 12px", fontSize: 18, textAlign: "center", color: "#111827" }}>Attenzione — Valori Stimati</h2>
            <p style={{ margin: "0 0 14px", fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
              Tutti i calcoli forniti da questa app — tra cui BMR, TDEE, percentuale di massa grassa, peso obiettivo e dispendio calorico — sono <strong>stime indicative</strong> basate su formule matematiche standardizzate.
            </p>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
              I risultati possono variare in base a fattori individuali. <strong>Utilizza questi dati come spunto di riflessione</strong>, non come valori assoluti.
            </p>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6B7280", lineHeight: 1.6, background: "#F9FAFB", borderRadius: 10, padding: "10px 14px" }}>
              Per un piano personalizzato rivolgiti sempre a un medico, dietologo o professionista del fitness qualificato.
            </p>
            <button onClick={() => setShowDisclaimer(false)} style={{ width: "100%", padding: "13px 0", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>✅ Ho Capito</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1, marginBottom: 6 }}>
          <span style={{ color: "#111827" }}>The</span><span style={{ color: "#DC2626" }}>Gym</span><span style={{ color: "#111827" }}>me</span>
        </div>
        <h2 style={{ margin: "4px 0 6px", fontSize: 22 }}>Calcolatore Calorie & Dispendio Energetico</h2>
        <p style={{ color: "#6B7280", fontSize: 13, margin: "0 0 12px" }}>Fabbisogno calorico, deficit, massa grassa, corsa e camminata per perdere 1 kg</p>
        <button onClick={() => setShowGuide(true)} style={{ padding: "8px 20px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#374151" }}>📖 Guida utilizzo</button>
      </div>

      {/* Form */}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>📋 Dati principali</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={lStyle}>Peso (kg)</label><input style={iStyle} type="number" placeholder="es. 75" value={form.weight} onChange={e => setF("weight", e.target.value)} /></div>
          <div><label style={lStyle}>Altezza (cm)</label><input style={iStyle} type="number" placeholder="es. 175" value={form.height} onChange={e => setF("height", e.target.value)} /></div>
          <div><label style={lStyle}>Età (anni)</label><input style={iStyle} type="number" placeholder="es. 30" value={form.age} onChange={e => setF("age", e.target.value)} /></div>
          <div>
            <label style={lStyle}>Sesso biologico</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["M","F"].map(s => (
                <button key={s} onClick={() => setF("sex", s)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: form.sex === s ? "#4F46E5" : "#F3F4F6", color: form.sex === s ? "#fff" : "#374151" }}>{s === "M" ? "♂ Uomo" : "♀ Donna"}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={lStyle}>Livello di attività fisica</label>
          <select style={{ ...iStyle, cursor: "pointer" }} value={form.activity} onChange={e => setF("activity", parseInt(e.target.value))}>
            {activityLevels.map((l, i) => <option key={i} value={i}>{l.label}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          📏 Misure corporee <span style={{ color: "#9CA3AF", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opzionale)</span>
        </div>
        <div style={{ background: "#FEF2F2", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#991B1B", marginBottom: 12 }}>
          Misura con metro da sarto rilassato sulla pelle. Ripeti 2-3 volte e usa la media. Misura al mattino a digiuno.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: form.sex === "F" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 14, marginBottom: 18 }}>
          <div><label style={lStyle}>Vita (cm)</label><input style={iStyle} type="number" placeholder={form.sex === "M" ? "All'ombelico" : "Punto più stretto"} value={form.waist} onChange={e => setF("waist", e.target.value)} /></div>
          <div><label style={lStyle}>Collo (cm)</label><input style={iStyle} type="number" placeholder="Sotto il pomo d'Adamo" value={form.neck} onChange={e => setF("neck", e.target.value)} /></div>
          {form.sex === "F" && <div><label style={lStyle}>Fianchi (cm)</label><input style={iStyle} type="number" placeholder="Punto più largo" value={form.hips} onChange={e => setF("hips", e.target.value)} /></div>}
        </div>
        <button onClick={calculate} style={{ width: "100%", padding: "13px 0", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Calcola 🔥</button>
      </div>

      {result && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <KpiCard label="BMR (riposo)" value={result.bmr + " kcal"} sub="metabolismo basale" color="#6366F1" />
            <KpiCard label="TDEE (totale)" value={result.tdee + " kcal"} sub="fabbisogno giornaliero" color="#0EA5E9" />
            <KpiCard label="BMI" value={result.bmi} sub={getBMIInfo(parseFloat(result.bmi)).label} color={getBMIInfo(parseFloat(result.bmi)).color} note="⚠️ Solo dato matematico" />
          </div>
          <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#92400E", marginBottom: 14 }}>
            <strong>⚠️ Il BMI è solo un indice matematico</strong>: non distingue massa grassa da massa muscolare.
          </div>

          {result.bf && (
            <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: 18, marginBottom: 14 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>🫀 Composizione corporea (Metodo US Navy)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                <KpiCard label="Massa grassa" value={result.bf.toFixed(1) + "%"} sub={getBFCategory(result.sex, result.bf).label} color={getBFCategory(result.sex, result.bf).color} />
                <KpiCard label="Grasso (kg)" value={result.fatKg.toFixed(1) + " kg"} sub="massa adiposa" color={getBFCategory(result.sex, result.bf).color} />
                <KpiCard label="Massa magra" value={result.leanKg.toFixed(1) + " kg"} sub="muscoli + ossa + organi" color="#059669" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>Range ACE per {result.sex === "M" ? "uomini" : "donne"}</div>
                <div style={{ position: "relative", marginTop: 20 }}>
                  <div style={{ display: "flex", borderRadius: 6, overflow: "hidden" }}>
                    {(result.sex === "M"
                      ? [{l:"Ess.",min:0,max:6,c:"#3B82F6"},{l:"Atleta",min:6,max:14,c:"#059669"},{l:"Fitness",min:14,max:18,c:"#10B981"},{l:"Media",min:18,max:25,c:"#D97706"},{l:"Obesità",min:25,max:40,c:"#DC2626"}]
                      : [{l:"Ess.",min:0,max:14,c:"#3B82F6"},{l:"Atleta",min:14,max:21,c:"#059669"},{l:"Fitness",min:21,max:25,c:"#10B981"},{l:"Media",min:25,max:32,c:"#D97706"},{l:"Obesità",min:32,max:50,c:"#DC2626"}]
                    ).map((seg, i) => {
                      const total = result.sex === "M" ? 40 : 50;
                      const pct = ((seg.max - seg.min) / total) * 100;
                      const inRange = result.bf >= seg.min && result.bf < seg.max;
                      return (
                        <div key={i} style={{ width: pct + "%", height: 22, background: seg.c, opacity: inRange ? 1 : 0.25, position: "relative" }}>
                          {inRange && <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 800, color: seg.c, whiteSpace: "nowrap" }}>{result.bf.toFixed(1)}%</div>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#9CA3AF" }}>
                    <span>Ess.</span><span>Atleta</span><span>Fitness</span><span>Media</span><span>Obesità</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {result.bf && <SimulatoreBlock result={result} />}

          {!result.bf && (
            <div style={{ background: "#FEF9C3", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#78350F", marginBottom: 14 }}>
              💡 Inserisci <strong>vita e collo{result.sex === "F" ? " e fianchi" : ""}</strong> per sbloccare la <strong>composizione corporea</strong> e il <strong>simulatore dimagrimento</strong>.
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {tabs.map(t => (
              <button key={t[0]} onClick={() => setTab(t[0])} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: tab === t[0] ? "#4F46E5" : "#F3F4F6", color: tab === t[0] ? "#fff" : "#374151" }}>{t[1]}</button>
            ))}
          </div>

          {tab === "calorie" && (
            <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: 18, marginBottom: 14 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>📉 Opzioni di deficit calorico</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {deficits.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F9FAFB", borderRadius: 10, padding: "12px 14px", borderLeft: "4px solid " + d.color }}>
                    <div>
                      <div style={{ fontWeight: 700, color: d.color, fontSize: 14 }}>{d.label} (-{d.kcal} kcal)</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Obiettivo: perdere {d.rate}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{result.tdee - d.kcal}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>kcal/giorno</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "running" && (
            <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: 18, marginBottom: 14 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>Formula RunForFatLoss</h3>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280" }}>Kcal bruciate/km = 0.8 x peso → <strong>{result.kcalPerKm} kcal/km</strong> per te</p>
              <BigBox color="#4F46E5" km={result.kmFor1kg} mode="run" />
              <h4 style={{ margin: "0 0 10px", fontSize: 14 }}>📅 Come distribuire i km</h4>
              <ActivityRows items={[
                { periodo: "In 1 giorno", km: result.kmPerDay1, emoji: "🔥", color: "#DC2626", note: "Sconsigliato, sforzo estremo" },
                { periodo: "In 1 settimana", km: result.kmPerDay7, emoji: "💪", color: "#D97706", note: "Impegnativo ma fattibile" },
                { periodo: "In 2 settimane", km: result.kmPerDay14, emoji: "🏃", color: "#059669", note: "Ritmo sostenibile e consigliato" },
              ]} />
            </div>
          )}

          {tab === "walking" && (
            <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: 18, marginBottom: 14 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>Formula Camminata</h3>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280" }}>Kcal bruciate/km = 0.5 x peso → <strong>{result.kcalPerKmWalk} kcal/km</strong> per te</p>
              <BigBox color="#059669" km={result.kmFor1kgWalk} mode="walk" />
              <h4 style={{ margin: "0 0 10px", fontSize: 14 }}>📅 Come distribuire i km</h4>
              <ActivityRows items={[
                { periodo: "In 1 giorno", km: result.kmPerDay1Walk, emoji: "🔥", color: "#DC2626", note: "Sconsigliato, sforzo estremo" },
                { periodo: "In 1 settimana", km: result.kmPerDay7Walk, emoji: "💪", color: "#D97706", note: "Impegnativo ma fattibile" },
                { periodo: "In 2 settimane", km: result.kmPerDay14Walk, emoji: "🚶", color: "#059669", note: "Ritmo sostenibile e consigliato" },
              ]} />
              <h4 style={{ margin: "0 0 10px", fontSize: 14 }}>⚖️ Corsa vs Camminata</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "🏃 Corsa", kcal: result.kcalPerKm, km: result.kmFor1kg, color: "#4F46E5" },
                  { label: "🚶 Camminata", kcal: result.kcalPerKmWalk, km: result.kmFor1kgWalk, color: "#059669" },
                ].map((c, i) => (
                  <div key={i} style={{ background: "#F9FAFB", borderRadius: 10, padding: 12, textAlign: "center", borderTop: "3px solid " + c.color }}>
                    <div style={{ fontWeight: 700, color: c.color, fontSize: 14, marginBottom: 6 }}>{c.label}</div>
                    <div style={{ fontSize: 13, color: "#374151" }}><strong>{c.kcal} kcal</strong>/km</div>
                    <div style={{ fontSize: 13, color: "#374151", marginTop: 2 }}><strong>{c.km} km</strong> totali per 1 kg</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}