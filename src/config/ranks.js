export const USMC_RANKS = Object.freeze([
  ["Private","Pvt","E-1"],["Private First Class","PFC","E-2"],["Lance Corporal","LCpl","E-3"],
  ["Corporal","Cpl","E-4"],["Sergeant","Sgt","E-5"],["Staff Sergeant","SSgt","E-6"],
  ["Gunnery Sergeant","GySgt","E-7"],["Master Sergeant","MSgt","E-8"],["First Sergeant","1stSgt","E-8"],
  ["Master Gunnery Sergeant","MGySgt","E-9"],["Sergeant Major","SgtMaj","E-9"],["Warrant Officer","WO","W-1"],
  ["Chief Warrant Officer 2","CWO2","W-2"],["Chief Warrant Officer 3","CWO3","W-3"],["Chief Warrant Officer 4","CWO4","W-4"],
  ["Chief Warrant Officer 5","CWO5","W-5"],["Second Lieutenant","2ndLt","O-1"],["First Lieutenant","1stLt","O-2"],
  ["Captain","Capt","O-3"],["Major","Maj","O-4"],["Lieutenant Colonel","LtCol","O-5"],["Colonel","Col","O-6"],
  ["Brigadier General","BGen","O-7"],["Major General","MajGen","O-8"],["Lieutenant General","LtGen","O-9"]
].map(([name,abbreviation,paygrade],order)=>({name,abbreviation,paygrade,order:order+1})));
export const RANK_CHOICES=USMC_RANKS.map(r=>({name:`${r.name} (${r.paygrade})`,value:r.abbreviation}));
export const getRank=(abbr)=>USMC_RANKS.find(r=>r.abbreviation===abbr)??null;
