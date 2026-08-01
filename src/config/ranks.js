const ranks = [
  ["recruit","Recruit","Rct","Recruit",0],
  ["private","Private","Pvt","E-1",1],
  ["private_first_class","Private First Class","PFC","E-2",2],
  ["lance_corporal","Lance Corporal","LCpl","E-3",3],
  ["corporal","Corporal","Cpl","E-4",4],
  ["sergeant","Sergeant","Sgt","E-5",5],
  ["staff_sergeant","Staff Sergeant","SSgt","E-6",6],
  ["gunnery_sergeant","Gunnery Sergeant","GySgt","E-7",7],
  ["master_sergeant","Master Sergeant","MSgt","E-8",8],
  ["first_sergeant","First Sergeant","1stSgt","E-8",9],
  ["master_gunnery_sergeant","Master Gunnery Sergeant","MGySgt","E-9",10],
  ["sergeant_major","Sergeant Major","SgtMaj","E-9",11],
  ["sergeant_major_marine_corps","Sergeant Major of the Marine Corps","SMMC","E-9",12],
  ["warrant_officer","Warrant Officer","WO","W-1",20],
  ["chief_warrant_officer_2","Chief Warrant Officer 2","CWO2","W-2",21],
  ["chief_warrant_officer_3","Chief Warrant Officer 3","CWO3","W-3",22],
  ["chief_warrant_officer_4","Chief Warrant Officer 4","CWO4","W-4",23],
  ["chief_warrant_officer_5","Chief Warrant Officer 5","CWO5","W-5",24],
  ["second_lieutenant","Second Lieutenant","2ndLt","O-1",30],
  ["first_lieutenant","First Lieutenant","1stLt","O-2",31],
  ["captain","Captain","Capt","O-3",32],
  ["major","Major","Maj","O-4",33],
  ["lieutenant_colonel","Lieutenant Colonel","LtCol","O-5",34],
  ["colonel","Colonel","Col","O-6",35],
  ["brigadier_general","Brigadier General","BGen","O-7",36],
  ["major_general","Major General","MajGen","O-8",37],
  ["lieutenant_general","Lieutenant General","LtGen","O-9",38],
  ["general","General","Gen","O-10",39]
].map(([key,name,abbreviation,paygrade,order]) => ({
  key, name, abbreviation, paygrade, order, roleId: ""
}));

const getRank = key => ranks.find(r => r.key === key);
module.exports = { ranks, getRank };
