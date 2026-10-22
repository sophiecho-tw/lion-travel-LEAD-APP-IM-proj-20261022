'use strict';

function enrichTravelers(data){
  data.privateNotes=data.privateNotes||{};
  const pairs={p1:['p2'],p2:['p1'],p3:['p4'],p4:['p3'],p5:['p6'],p6:['p5'],p7:['p8'],p8:['p7'],p9:['p10'],p10:['p9'],p11:['p12'],p12:['p11']};
  data.people.forEach((p,i)=>{
    p.memberNo=p.memberNo||String(i+1).padStart(3,'0');
    p.companions=p.companions||pairs[p.id]||[];
    p.hotel=p.hotel||'京都站前飯店（示範）';
    p.stay=p.stay||'10/19 入住 — 10/20 退房';
    p.baseRoom=p.baseRoom||p.room;
    p.stays=p.stays||[
      {day:1,checkIn:'2026-10-16',checkOut:'2026-10-17',hotel:'京都站前飯店（示範）',room:p.baseRoom},
      {day:2,checkIn:'2026-10-17',checkOut:'2026-10-18',hotel:'京都站前飯店（示範）',room:p.baseRoom},
      {day:3,checkIn:'2026-10-18',checkOut:'2026-10-19',hotel:'奈良公園飯店（示範）',room:String(Number(p.baseRoom)+200)},
      {day:4,checkIn:'2026-10-19',checkOut:'2026-10-20',hotel:'大阪御堂筋飯店（示範）',room:String(Number(p.baseRoom)+400)}
    ];
    const stay=currentStay(p);p.room=stay.room;p.hotel=stay.hotel;
    p.details=p.details||{orderNo:'2026-'+String(18829+Math.floor(i/2)),identityNo:'A12***'+String(789+i),englishName:i===0?'MR LIN/HSIAOMING':'TRAVELER / DEMO '+String(i+1).padStart(2,'0'),birthday:`${1978+i}-11-11`,passportNo:'54***'+String(67+i),passportExpiry:'2030-12-24',permitNo:'345***'+String(767+i),permitExpiry:'2028-12-24',pnr:'DEMO'+String(Math.floor(i/2)+1).padStart(2,'0'),remarks:i===0?'餐食需避開牛肉與甲殼類，請協助與餐廳確認。':'依訂單需求安排，其他事項請與業務確認。'};
    p.phone=p.phone||'09XX-XXX-'+String(i+1).padStart(3,'0');
    if(!p.attention)p.attention=p.id==='p1'?['有抽菸','忌牛','忌甲殼類']:p.diet==='不吃牛'?['忌牛']:p.diet==='素食'?['素食']:[];
    if(p.id==='p1'&&p.diet==='一般餐')p.diet='忌牛、忌甲殼類';
  });
  Object.values(data.drafts||{}).forEach(d=>{d.attachments=(d.attachments||[]).filter(a=>a.kind!=='traveler');});
  if(!data.travelerNotesInitialized){
    if(!Object.prototype.hasOwnProperty.call(data.privateNotes,'t1:p1'))data.privateNotes['t1:p1']='集合前請再提醒一次，偏好電話聯繫。';
    data.travelerNotesInitialized=true;
  }
}
function upgradeCompactTraveler(data){
  if(data.compactTravelerV1)return;
  const extras={p1:['輪椅','糖尿病','高血壓'],p2:['高血壓']};
  data.people.forEach(p=>{p.attention=[...new Set([...(p.attention||[]),...(extras[p.id]||[])])];});
  const key='t1:p1';if(data.privateNotes[key]==='集合前請再提醒一次，偏好電話聯繫。')data.privateNotes[key]='集合前請再提醒一次，並確認隨身物品。\n行走較慢，上下車請預留時間並協助安排。\n餐食需求請先和餐廳確認，避免臨時更換。';
  data.compactTravelerV1=true;
}
function travelerNote(pid){return state.privateNotes[state.tour+':'+pid]||'';}
function joinTag(p){return p&&!p.joined?'<span class="join-tag">未加入</span>':'';}
function attentionTags(p){const tags=p.attention?.length?p.attention:[p.diet||'無特殊需求'];return tags.map(t=>`<span class="attention-tag">${esc(t)}</span>`).join('');}
function travelerBrief(p){
  const note=travelerNote(p.id);
  return `<aside class="traveler-brief" data-action="profile" data-id="${p.id}" role="button" tabindex="0" aria-label="查看${esc(p.name)}的旅客資訊"><div class="traveler-tags">${attentionTags(p)}</div>${note.trim()?`<div class="brief-note-direct"><p>${nl(note)}</p></div>`:''}</aside>`;
}
function profileSection(title,content){return `<section class="profile-section"><h3>${title}</h3>${content}</section>`;}
function taipeiDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function currentStay(p,date=taipeiDate()){return p.stays.find(s=>s.checkIn<=date&&date<s.checkOut)||p.stays.find(s=>s.checkIn>date)||p.stays.at(-1);}
function dayDate(date){return date.slice(5).replace('-','/');}
function lodgingPeriods(p){const periods=[];p.stays.forEach(stay=>{const last=periods.at(-1);if(last&&last.hotel===stay.hotel&&last.room===stay.room&&last.checkOut===stay.checkIn)last.checkOut=stay.checkOut;else periods.push({...stay});});return periods;}
function stayToggle(p){return lodgingPeriods(p).length>1?btn('toggle-stays','展開 '+icon('down'),'stay-toggle',`aria-expanded="false" aria-controls="stay-details-${p.id}"`):'';}
function travelerStays(p){
  const today=taipeiDate(),periods=lodgingPeriods(p);
  const current=currentStay(p),active=periods.find(stay=>stay.checkIn<=current.checkIn&&stay.checkOut>=current.checkOut&&stay.hotel===current.hotel&&stay.room===current.room),others=periods.filter(stay=>stay!==active);
  const row=stay=>`<article class="stay-row ${stay===active?'tonight':''}"><div class="between"><strong>${dayDate(stay.checkIn)}–${dayDate(stay.checkOut)}</strong>${stay===active?`<span class="pill green">${stay.checkIn<=today&&today<stay.checkOut?'當前住宿':stay.checkIn>today?'下一晚住宿':'最近住宿'}</span>`:''}</div><div class="stay-hotel"><span>${esc(stay.hotel)}</span><strong>房號 ${esc(stay.room)}</strong></div></article>`;
  return `<div class="stay-list current-stay">${row(active)}</div>${others.length?`<details class="other-stays" id="stay-details-${p.id}"><summary hidden>其他住宿</summary><div class="stay-list">${others.map(row).join('')}</div></details>`:''}`;
}
function ageAt(birthday){const today=taipeiDate(),age=Number(today.slice(0,4))-Number(birthday.slice(0,4));return age-(today.slice(5)<birthday.slice(5)?1:0);}
function memberDetails(p){const d=p.details;const rows=[['訂單編號',d.orderNo],['中文姓名',p.name],['身分證號',d.identityNo],['英文姓名',d.englishName],['生日',d.birthday.replaceAll('-','/')+'（'+ageAt(d.birthday)+' 歲）'],['護照號碼',d.passportNo],['護照效期',d.passportExpiry.replaceAll('-','/')],['台胞證號',d.permitNo],['台胞證效期',d.permitExpiry.replaceAll('-','/')],['PNR',d.pnr]];return profileSection('訂單與證件資料',`<dl class="member-details">${rows.map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`)+profileSection('團員備註',`<p class="member-remarks">${nl(d.remarks)}</p>`);}
function travelerProfile(p,full=false){
  const companions=p.companions.map(person).filter(Boolean);
  return `<div class="profile"><div>${avatar(p.name.slice(-2))}</div><div class="grow"><div class="traveler-name"><h2>${esc(p.name)}</h2>${joinTag(p)}</div></div>${!full?ib('close-modal','close','關閉').replace('class="iconbtn"','class="iconbtn profile-close"'):''}</div>
  ${full?`<div class="detail-tour">${esc(tours[state.tour].name)} · ${esc(tours[state.tour].code)}</div>${memberDetails(p)}`:''}
  ${profileSection('同行旅客',companions.length?`<div class="companion-list">${companions.map(q=>btn('profile',avatar(q.name.slice(-2))+esc(q.name)+joinTag(q),'companion-chip',`data-id="${q.id}"`)).join('')}</div>`:'<span class="muted">無同行資料</span>')}
  ${profileSection('分車',`<div class="car-assignment">${esc(p.car)}</div>`)}
  ${profileSection('住宿'+stayToggle(p),travelerStays(p))}
  ${profileSection('餐食與特殊需求',`<div class="traveler-tags">${attentionTags(p)}</div>`)}
  ${profileSection('個人備註',full?`<div class="private-note-content">${travelerNote(p.id)?nl(travelerNote(p.id)):'尚未新增'}</div>`:`<textarea id="traveler-note" maxlength="1200" rows="3" placeholder="例如：偏好電話聯繫、集合時需再提醒" aria-label="個人備註">${esc(travelerNote(p.id))}</textarea><div class="between note-actions">${btn('save-traveler-note','儲存備註','btn small',`data-id="${p.id}"`)}</div>`)}
  ${!full?`<div class="profile-links">${btn('member-full',icon('file')+' 查看完整團員資料','btn',`data-id="${p.id}"`)}${btn('private-person',icon('chat')+' 開啟個人對話','btn primary',`data-id="${p.id}"`)}</div>`:''}`;
}

function companyItineraries(){
  if(state.tour!=='t1')return [];
  const days=[
    ['2026-10-16','關西抵達・京都初見',[
      ['早餐','07:00','機上餐食'],['其他','10:30','抵達關西機場'],['午餐','12:00','日式定食'],['景點','14:00','嵐山竹林'],['景點','16:00','渡月橋'],['晚餐','18:00','京都迎賓料理'],['其他','20:00','京都飯店入住']]],
    ['2026-10-17','京都古都漫遊',[
      ['早餐','07:30','飯店早餐'],['景點','09:00','清水寺'],['景點','10:30','二年坂、三年坂'],['午餐','12:00','京風御膳'],['景點','14:00','伏見稻荷大社'],['景點','16:00','鴨川散步'],['晚餐','18:00','日式鍋物'],['景點','19:30','祇園'],['景點','20:00','花見小路']]],
    ['2026-10-18','奈良文化散策',[
      ['早餐','07:30','飯店早餐'],['景點','09:30','東大寺'],['景點','11:00','奈良公園'],['午餐','12:30','奈良風味餐'],['景點','14:00','春日大社'],['景點','16:00','奈良町老街'],['晚餐','18:00','飯店晚餐']]],
    ['2026-10-19','大阪城市慢遊',[
      ['早餐','07:30','飯店早餐'],['景點','09:00','大阪城公園'],['景點','10:30','中之島散步'],['午餐','12:00','大阪特色料理'],['景點','14:00','心齋橋'],['景點','16:00','道頓堀'],['晚餐','18:00','日式燒肉'],['景點','19:30','梅田夜景'],['其他','21:00','大阪飯店入住']]],
    ['2026-10-20','大阪・返程',[
      ['早餐','07:00','飯店早餐'],['其他','09:00','飯店退房、行李確認'],['景點','10:00','臨空城'],['午餐','12:00','機場午餐'],['其他','14:00','關西機場辦理登機']]]
  ];
  return days.map(([date,title,rows],i)=>({day:i+1,date,title,note:'請依領隊通知的集合時間準時集合，行程安排以現場通知為準。',items:rows.map(([type,time,title],j)=>({id:'company-'+i+'-'+j,type,time,title,note:''}))}));
}
function itineraryAttachment(plan){return {kind:'itinerary',name:'每日行程概覽 · '+plan.date,day:plan.day,title:plan.title,date:plan.date,note:plan.note,items:JSON.parse(JSON.stringify(plan.items.filter(r=>r.title.trim())))};}
function itineraryText(a){return `每日行程概覽｜${a.date}\n\n${a.items.map(r=>`${r.time?r.time+' ':''}${r.type}｜${r.title}${r.note?'\n'+r.note:''}`).join('\n')}${a.note?'\n\n提醒：'+a.note:''}`;}
function travelerAttachment(p){const stay=currentStay(p);return {kind:'traveler',name:'旅客模組 · '+p.name,pid:p.id,traveler:{name:p.name,memberNo:p.memberNo,car:p.car,room:stay.room,hotel:stay.hotel,stayDate:stay.checkIn,diet:p.diet,attention:[...(p.attention||[])]}};}
function travelerCardText(a){const p=a.traveler;return `旅客：${p.name}（團員 ${p.memberNo}）\n${p.car} · 房號 ${p.room}\n餐食：${p.diet}${p.attention.length?'\n注意事項：'+p.attention.join('、'):''}`;}
function renderTravelerCard(a){const p=a.traveler;return `<article class="traveler-card"><div class="traveler-card-label">${icon('user')}旅客模組<span>內部討論</span></div><div class="profile">${avatar(p.name.slice(-2))}<div><h3>${esc(p.name)}</h3></div></div><div class="traveler-card-facts"><span>${esc(p.car)} · 房號 ${esc(p.room)}</span><p>${p.stayDate?dayDate(p.stayDate)+' · ':''}${esc(p.hotel)}</p><strong>餐食與特殊需求</strong><div class="traveler-tags">${attentionTags(p)}</div></div>${btn('profile','查看旅客資訊 '+icon('chevron'),'traveler-card-link',`data-id="${esc(a.pid)}"`)}</article>`;}
const surveyUrl='https://www.liontravel.com/webcs/login_tppd19.aspx/';
function surveyAttachment(){return {kind:'survey',name:'意見調查表',title:'旅程意見調查',description:'感謝您參與這次旅程！邀請您填寫意見調查表，分享旅途中的感受，協助我們持續改善服務。',url:surveyUrl};}
function renderSurveyCard(a){
  return `<article class="survey-card"><div class="survey-card-heading">${icon('file')}<h3>${esc(a.title)}</h3></div><p>${nl(a.description)}</p><a class="survey-card-cta" href="${surveyUrl}" target="_blank" rel="noopener noreferrer">填寫意見調查表</a></article>`;
}
function messagePlainText(m){return [m.text,...(m.attachments||[]).filter(a=>['itinerary','traveler','survey'].includes(a.kind)).map(a=>a.kind==='survey'?[a.title,a.description,surveyUrl].join('\n'):a.kind==='traveler'?travelerCardText(a):itineraryText(a))].filter(Boolean).join('\n\n');}
function messageSummary(m){return m?.text||m?.attachments?.find(a=>['itinerary','traveler','survey'].includes(a.kind))?.name||(m?.attachments?.length?'[附件訊息]':'開始這段旅途的對話');}
function renderItineraryCard(a){
  return `<article class="itinerary-card"><header><div class="flex">${icon('calendar')}<span>每日行程概覽</span></div><strong>${esc(a.date)}</strong>${a.title?`<p class="itinerary-route">第 ${esc(a.day)} 天 · ${esc(a.title)}</p>`:''}<small>${a.items.length} 項安排</small></header><div class="itinerary-timeline">${a.items.map((r,i)=>`<div class="itinerary-stop ${r.type==='景點'?'spot':'meal'}"><span class="stop-marker">${r.type==='景點'?'':icon('check')}</span><div class="stop-body"><div class="between"><span class="stop-type">${esc(r.type)}</span>${r.time?`<time>${esc(r.time)}</time>`:''}</div><h4>${esc(r.title)}</h4>${r.note?`<p>${nl(r.note)}</p>`:''}</div></div>`).join('')}</div>${a.note?`<footer><strong>小提醒</strong><p>${nl(a.note)}</p></footer>`:''}</article>`;
}
function drawModuleModal(x,c){
  if(x.type==='survey-preview'){
    if(c.kind==='internal')return true;
    modal('預覽意見調查表',renderSurveyCard(x.card),btn('close-modal','取消','btn')+btn('survey-send','發送','btn primary'));document.querySelector('.modal').classList.add('survey-preview-modal');return true;
  }

  if(x.type==='traveler-picker'){
    const group=state.chats.find(z=>z.tour===state.tour&&z.kind==='announcement');
    const people=state.people.filter(p=>group.members.includes(p.id)).filter(p=>[p.name,p.memberNo,p.car].some(v=>v.includes(ui.modalQuery.trim())));
    modal('選擇旅客',`<div class="search">${icon('search')}<input id="person-search" aria-label="搜尋旅客" placeholder="搜尋姓名、團員編號或分車" value="${esc(ui.modalQuery)}"></div><div class="traveler-picker">${people.map(p=>`<button class="traveler-pick-row" data-action="traveler-pick" data-id="${p.id}">${avatar(p.name.slice(-2))}<span class="grow"><strong>${esc(p.name)} ${joinTag(p)}</strong><small>團員 ${esc(p.memberNo)} · ${esc(p.car)} · 房號 ${esc(p.room)}</small></span>${icon('chevron')}</button>`).join('')||'<div class="empty">找不到符合的旅客</div>'}</div>`,'','選一位旅客，建立內部討論卡片');return true;
  }
  if(x.type==='traveler-preview'){
    modal('預覽旅客模組',renderTravelerCard(x.card),btn('close-modal','取消','btn')+btn('traveler-module-apply','發送','btn primary'));document.querySelector('.modal').classList.add('traveler-preview-modal');return true;
  }

  if(x.type==='profile'||x.type==='member-full'){
    const p=person(x.pid),full=x.type==='member-full';
    modal(full?'完整團員資料':'',travelerProfile(p,full),full?btn('profile','返回旅客資訊','btn',`data-id="${p.id}"`):'');return true;
  }
  if(x.type==='itinerary-pick'){
    const plans=companyItineraries();
    modal('每日行程概覽',`<div class="template-target">發送至：${esc(c.name)}</div><div class="company-plan-list">${plans.map(plan=>`<button class="company-plan ${x.plan?.date===plan.date?'selected':''}" data-action="itinerary-select" data-date="${plan.date}" aria-pressed="${x.plan?.date===plan.date}"><span class="plan-day">第 ${plan.day} 天</span><span class="grow"><span class="plan-date">${dayDate(plan.date)}${plan.date===taipeiDate()?'<span class="pill green">今天</span>':''}</span><strong>${esc(plan.title)}</strong><small>${plan.items.length} 項安排 · 公司行程</small></span><span class="plan-radio">${x.plan?.date===plan.date?icon('check'):''}</span></button>`).join('')||'<div class="empty">此團尚無可發送的行程</div>'}</div>`,btn('close-modal','取消','btn')+btn('itinerary-preview','預覽行程','btn primary',x.plan?'':'disabled'),'選擇要發送的日期');return true;
  }
  if(x.type==='itinerary-preview'){
    modal('預覽每日行程',`<div class="template-target">發送至：${esc(c.name)}</div>${renderItineraryCard(itineraryAttachment(x.plan))}`,btn('itinerary-back','重新選擇','btn')+btn('itinerary-apply','發送行程','btn primary'),'公司行程');return true;
  }
  return false;
}
function handleModuleAction(action,el){
  const pid=el.dataset.id,index=Number(el.dataset.index);
  switch(action){
    case 'survey-new':{
      if(current().kind==='internal')return true;
      ui.plus=false;render();openModal('survey-preview',{card:surveyAttachment(),chatId:ui.chat});return true;
    }
    case 'survey-send':{
      if(current().kind==='internal'||ui.modal?.type!=='survey-preview'||ui.modal.chatId!==ui.chat)return true;
      if(state.offline){toast('目前離線，請連線後再發送。');return true;}
      const card=ui.modal.card;if(!card)return true;
      const message=makeMessage(ui.chat,{attachments:[card]});closeModal();render();toast(message.status==='failed'?'發送失敗，可點訊息下方重試。':'意見調查表已發送');return true;
    }

    case 'toggle-stays':{const details=document.getElementById(el.getAttribute('aria-controls'));if(details){details.open=!details.open;el.setAttribute('aria-expanded',String(details.open));el.innerHTML=(details.open?'收合 ':'展開 ')+icon('down');}return true;}

    case 'close-message-actions':closeMessageActions();return true;
    case 'traveler-module':{
      if(current().kind!=='internal')return true;
      ui.plus=false;render();openModal('traveler-picker');return true;
    }
    case 'traveler-pick':{if(current().kind!=='internal')return true;ui.modal.card=travelerAttachment(person(pid));ui.modal.type='traveler-preview';drawModal();return true;}
    case 'traveler-module-back':ui.modal.type='traveler-picker';drawModal();return true;
    case 'traveler-module-apply':{
      if(current().kind!=='internal')return true;
      if(state.offline){toast('目前離線，請連線後再發送。');return true;}const card=ui.modal.card;if(!card)return true;const message=makeMessage(ui.chat,{attachments:[card]});closeModal();render();toast(message.status==='failed'?'發送失敗，可點訊息下方重試。':'旅客模組已發送（模擬）');return true;
    }

    case 'member-full':openModal('member-full',{pid});return true;
    case 'save-traveler-note':state.privateNotes[state.tour+':'+pid]=$('#traveler-note').value.trim();save();render();openModal('profile',{pid});toast('個人備註已儲存');return true;
    case 'itinerary-new':ui.plus=false;render();openModal('itinerary-pick');return true;
    case 'itinerary-edit-draft':{const a=draft().attachments[index],plan=companyItineraries().find(p=>p.date===a.date);openModal('itinerary-pick',{plan,attachmentIndex:index});return true;}
    case 'itinerary-select':ui.modal.plan=companyItineraries().find(plan=>plan.date===el.dataset.date);drawModal();return true;
    case 'itinerary-preview':if(ui.modal.plan){ui.modal.type='itinerary-preview';drawModal();}return true;
    case 'itinerary-back':ui.modal.type='itinerary-pick';drawModal();return true;
    case 'itinerary-apply':{
      const plan=companyItineraries().find(p=>p.date===ui.modal.plan?.date);if(!plan)return true;
      if(state.offline){toast('目前離線，請連線後再發送。');return true;}
      const message=makeMessage(ui.chat,{attachments:[itineraryAttachment(plan)]});
      if(Number.isInteger(ui.modal.attachmentIndex)){draft().attachments.splice(ui.modal.attachmentIndex,1);save();}
      closeModal();render();toast(message.status==='failed'?'發送失敗，可點訊息下方重試。':'每日行程已發送（模擬）');return true;
    }
    default:return false;
  }
}

function ensureTalkGroup(data){
  const gid='demo-tour-chat',members=data.people.filter(p=>p.joined).map(p=>p.id);
  if(!data.chats.some(c=>c.id===gid))data.chats.splice(2,0,{id:gid,tour:'t1',kind:'group',name:'旅途交流・多人討論',members});
  if(data.messages.some(m=>m.chat===gid))return;
  const rows=[
    ['me','大家早安！今天 09:00 在飯店大廳集合，有行程或餐食問題都可以在這裡討論。'],
    ['p1','早安！我和怡君會提早到大廳等大家。'],
    ['p2','請問今天需要把行李帶下樓嗎？'],
    ['me','需要喔，今天會更換飯店，請帶齊行李並確認房內沒有遺留物品。'],
    ['p3','收到，我們房間已經整理好了。'],
    ['p4','請問午餐有提供素食嗎？謝謝！'],
    ['me','已經幫您確認素食餐，抵達餐廳後我會協助安排。'],
    ['p5','我有帶雨傘，今天如果下雨也沒問題。'],
    ['p6','想確認遊覽車停在飯店的哪一側？'],
    ['p7','我剛經過大廳，看到紅色團旗在右側出口。'],
    ['me','對，在大廳右側出口，請認明紅色團旗，現場我會協助大家上車。'],
    ['p8','收到！我們會準時到，謝謝領隊。'],
    ['p9','今天走路的時間會很長嗎？想先準備一下。'],
    ['me','上午會步行參觀，中間有休息時間，需要協助可以隨時找我。'],
    ['p1','了解，謝謝，我會穿比較好走的鞋子。'],
    ['p4','餐食安排收到，謝謝！'],
    ['p6','找到集合位置了，我們已經在樓下。'],
    ['p2','行李也帶齊了，等等見！']
  ];
  rows.forEach(([sender,text],i)=>data.messages.push({id:'talk-demo-'+i,chat:gid,sender,text,at:new Date(taipeiDate()+'T08:'+String(30+i).padStart(2,'0')+':00+08:00').toISOString(),read:sender==='me'?members.slice(0,5):[],confirmed:[],attachments:[],status:'sent'}));
}
function messageAvatar(m,p,own){
  const label=own?'陳':p?.name.slice(-2)||'旅客';
  if(!own&&p&&!p.role)return `<button class="avatar message-person-avatar" data-action="profile" data-id="${p.id}" aria-label="查看${esc(p.name)}的個人資料">${travelerAvatarContent(label)}</button>`;
  return avatar(label,own?'rose':'');
}
function messageAuthor(m,p,own){return !own&&p&&!p.role?btn('profile',esc(p.name),'msg-person-name',`data-id="${p.id}" aria-label="查看${esc(p.name)}的個人資料"`):esc(own?'陳小姐':p?.name||'旅客');}

function closeMessageActions(){document.querySelector('#message-actions')?.remove();document.querySelector('.press-selected')?.classList.remove('press-selected');}
function showMessageActions(mid){
  closeMessageActions();
  const message=getMsg(mid),bubble=document.querySelector(`[data-message="${mid}"] .bubble`);if(!message||!bubble)return;
  const internal=state.chats.find(c=>c.id===message.chat)?.kind==='internal';
  const actions=[['copy','file','複製'],['reply','chat','回覆'],...(message.text.trim()?[['translate','translate',ui.translated.has(mid)?'收起翻譯':'翻譯']]:[]),...(!internal?[['forward','forward','轉發']]:[]),...(message.sender==='me'&&message.status!=='failed'?[['receipts','info','訊息資訊']]:[])];
  const layer=document.createElement('div');layer.id='message-actions';
  layer.innerHTML=`<button class="message-action-shade" data-action="close-message-actions" aria-label="關閉訊息操作"></button><section class="message-action-grid" role="menu" aria-label="訊息操作" style="--action-columns:${Math.min(actions.length,5)}">${actions.map(([action,glyph,label])=>btn(action,icon(glyph)+`<span>${label}</span>`,'message-action',`data-id="${mid}" role="menuitem"`)).join('')}</section>`;
  document.body.append(layer);bubble.classList.add('press-selected');
  const rect=bubble.getBoundingClientRect(),menu=layer.querySelector('section'),bounds=menu.getBoundingClientRect(),below=(rect.top+rect.bottom)/2<innerHeight/2;
  menu.dataset.side=below?'below':'above';
  menu.style.left=Math.max(10,Math.min(rect.left,innerWidth-bounds.width-10))+'px';
  menu.style.top=Math.max(10,Math.min(below?rect.bottom+10:rect.top-bounds.height-10,innerHeight-bounds.height-10))+'px';
  menu.querySelector('button')?.focus({preventScroll:true});
}
function setupMessageGestures(){
  let press=null;
  const cancel=()=>{if(press)clearTimeout(press.timer);press=null;};
  document.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    const bubble=e.target.closest('#messages .bubble');if(!bubble||e.target.closest('button,a,input,textarea'))return;
    cancel();press={x:e.clientX,y:e.clientY,bubble,timer:setTimeout(()=>{showMessageActions(bubble.closest('[data-message]').dataset.message);press=null;},500)};
  });
  document.addEventListener('pointermove',e=>{if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>10)cancel();});
  document.addEventListener('pointerup',cancel);document.addEventListener('pointercancel',cancel);
  document.addEventListener('contextmenu',e=>{const bubble=e.target.closest('#messages .bubble');if(bubble){e.preventDefault();cancel();showMessageActions(bubble.closest('[data-message]').dataset.message);}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMessageActions();if(e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey){const bubble=e.target.closest('#messages .bubble');if(bubble){e.preventDefault();showMessageActions(bubble.closest('[data-message]').dataset.message);}}});
  document.addEventListener('scroll',()=>{cancel();closeMessageActions();},true);window.addEventListener('resize',closeMessageActions);
}

function translationTarget(m){return state.translationLanguage||(/^[A-Za-z]/.test(m.text.trim())?'繁體中文':'English');}
function renderMessageTranslation(m){
  if(!ui.translated.has(m.id))return '';
  const english=/^[A-Za-z]/.test(m.text.trim());
  const examples={
    '餐食安排收到，謝謝！':'Thank you for arranging the meals!',
    '行李也帶齊了，等等見！':'We have all our luggage. See you soon!',
    '早安！我和怡君會提早到大廳等大家。':'Good morning! Yi-chun and I will arrive at the lobby early.',
    '請問今天需要把行李帶下樓嗎？':'Do we need to bring our luggage downstairs today?',
    '收到，我們房間已經整理好了。':'Understood. We have finished packing our room.',
    '請問午餐有提供素食嗎？謝謝！':'Is a vegetarian lunch available? Thank you!',
    '已經幫您確認素食餐，抵達餐廳後我會協助安排。':'Your vegetarian meal is confirmed. I will help with the arrangements at the restaurant.',
    '我有帶雨傘，今天如果下雨也沒問題。':'I have an umbrella, so I am ready if it rains today.',
    '想確認遊覽車停在飯店的哪一側？':'Which side of the hotel is the tour bus parked on?',
    '我剛經過大廳，看到紅色團旗在右側出口。':'I just passed the lobby and saw the red tour flag at the exit on the right.',
    '收到！我們會準時到，謝謝領隊。':'Understood! We will arrive on time. Thank you!',
    '今天走路的時間會很長嗎？想先準備一下。':'Will we be walking for a long time today? I would like to prepare.',
    '了解，謝謝，我會穿比較好走的鞋子。':'Thank you. I will wear comfortable walking shoes.',
    '找到集合位置了，我們已經在樓下。':'We found the meeting point and are already downstairs.',
    '大家早安！今天 09:00 在飯店大廳集合，有行程或餐食問題都可以在這裡討論。':'Good morning! Meet in the hotel lobby at 9:00. Please discuss any itinerary or meal questions here.',
    '需要喔，今天會更換飯店，請帶齊行李並確認房內沒有遺留物品。':'Yes, we are changing hotels today. Bring all your luggage and check that nothing is left in your room.',
    '對，在大廳右側出口，請認明紅色團旗，現場我會協助大家上車。':'Yes, meet at the exit on the right of the lobby by the red tour flag. I will help everyone board the bus.',
    '上午會步行參觀，中間有休息時間，需要協助可以隨時找我。':'We will walk during the morning visits, with rest breaks. Please ask me whenever you need assistance.'
  };
  const sameLanguage=translationTarget(m)===(english?'English':'繁體中文');
  const text=sameLanguage?m.text:(m.translation||examples[m.text]);
  return `<div class="translation" tabindex="0" aria-label="譯文，長按開啟翻譯設定">${text?nl(text):'<span>此訊息尚無預設譯文。</span>'}</div>`;
}

function receiptPersonRow(p,m){
  const content=avatar(p.name.slice(-2))+`<div class="grow"><span class="name">${esc(p.name)}</span> ${!p.joined?'<span class="pill amber">尚未加入</span>':''}<div class="sub">${m.confirmed.includes(p.id)?'已確認收到':m.read.includes(p.id)?'已讀，尚未確認':'未讀'}${m.read.includes(p.id)?' · '+fullTime(m.readAt?.[p.id]||m.at):''}</div></div>`;
  return `<div class="person receipt-list-person">${p.role?`<div class="receipt-person">${content}</div>`:btn('profile',content,'receipt-person',`data-id="${p.id}" aria-label="查看${esc(p.name)}的旅客資訊"`)}${p.role?'':btn('guest-preview','模擬查看','btn small',`data-id="${p.id}"`)}</div>`;
}

document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('.traveler-brief')){event.preventDefault();event.target.click();}});

function travelerAvatarContent(label){
  if(typeof label!=='string')return label;
  const person=state.people.find(p=>p.name===label||p.name.slice(-2)===label);
  const photo=person&&['p1','p2','p3','p4'].includes(person.id)?'assets/avatars/'+person.id+'.jpg':null;
  return photo?`<img class="avatar-photo" src="${photo}" alt="${esc(person.name)}的示範頭像" loading="lazy" decoding="async">`:esc(label);
}
