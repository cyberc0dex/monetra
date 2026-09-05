(() => {
  "use strict";
  const config = window.MONETRA_CONFIG;
  const isProduction = config.environment === "production";
  const storage = isProduction ? localStorage : sessionStorage;
  const $app = document.querySelector("#app");
  const $modal = document.querySelector("#modal-root");
  let activeView = "home";
  let homeBalancesVisible = false;
  const hiddenBalance = "$••••••";

  const uid = prefix => `${prefix}_${crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;
  const isoToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  };
  const createDefaultProfile = (id = uid("profile"), displayName = config.defaultProfile.displayName) => ({
    id,
    profileInfo: { displayName, caption: config.defaultProfile.caption },
    accounts: [{ id: uid("account"), title: config.defaultProfile.accountTitle, amount: 0, icon: "money", tagColor: config.accountTagColours[0] }],
    valueItems: [],
    vehicle: {
      name: config.defaultProfile.vehicleName, originalPrice: 0, loanTotal: 0, purchaseMonth: "",
      monthlyPayment: 0,
      vehicleType: config.defaultProfile.vehicleType, vehicleColour: config.defaultProfile.vehicleColour
    },
    activities: []
  });
  const createDefaultState = () => {
    const profile = createDefaultProfile();
    return { schemaVersion: config.schemaVersion, currentProfileId: profile.id, profiles: { [profile.id]: profile } };
  };
  const loadState = () => {
    try {
      const parsed = JSON.parse(storage.getItem(config.storageKey));
      if (parsed?.schemaVersion === 1 && parsed.profiles?.[parsed.currentProfileId]) return parsed;
    } catch (error) { console.warn("Monetra state could not be loaded.", error); }
    return createDefaultState();
  };
  let state = loadState();
  const saveState = () => storage.setItem(config.storageKey, JSON.stringify(state));
  const profile = () => state.profiles[state.currentProfileId];
  const money = value => `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const displayDate = iso => new Intl.DateTimeFormat("en-US", { day:"numeric", month:"short", year:"numeric" }).format(new Date(`${iso}T12:00:00`));
  const calendarDays = (from, to = isoToday()) => Math.round((new Date(`${to}T12:00:00`) - new Date(`${from}T12:00:00`)) / 86400000);
  const ownershipDays = date => Math.max(1, calendarDays(date) + 1);
  const esc = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const lucideIconNames = Object.freeze({
    home: "house",
    value: "coins",
    vehicle: "car-front",
    activity: "calendar-days",
    chevron: "chevron-right",
    edit: "pencil",
    money: "circle-dollar-sign"
  });
  const icon = (name, cls = "") => `<svg class="icon ${cls}" aria-hidden="true"><use href="assets/icons/lucide.svg#${esc(lucideIconNames[name] || name)}"></use></svg>`;
  const iconBubble = (name, tone = "") => `<span class="icon-bubble ${tone}">${icon(name)}</span>`;
  const accountTag = account => { const colour=config.accountTagColours.includes(account.tagColor)?account.tagColor:config.accountTagColours[0];return `<span class="icon-bubble account-tag" style="--tag-colour:${colour};--tag-tint:${colour}22">${icon("money")}</span>`; };
  const toast = message => {
    const root = document.querySelector("#toast-root");
    root.innerHTML = `<div class="toast">${esc(message)}</div>`;
    setTimeout(() => { root.innerHTML = ""; }, 2200);
  };
  const commit = (message = "Saved") => { saveState(); render(); closeModal(); toast(message); };
  const closeModal = () => { $modal.innerHTML = ""; document.body.style.overflow = ""; };
  const showModal = html => {
    $modal.innerHTML = `<div class="modal-backdrop" data-dismiss="true"><section class="modal" role="dialog" aria-modal="true">${html}</section></div>`;
    document.body.style.overflow = "hidden";
    $modal.querySelector(".modal")?.focus();
  };
  const modalHead = title => `<header class="modal-head"><h2 class="modal-title">${esc(title)}</h2><button class="close" type="button" data-close aria-label="Close">×</button></header>`;
  const formActions = (label = "Save") => `<div class="actions"><button class="btn ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">${esc(label)}</button></div>`;
  const nav = () => `<nav class="bottom-nav" aria-label="Main navigation">${[
    ["home","Home"],["value","Value"],["vehicle","Vehicle"],["activity","Activities"],["settings","Settings"]
  ].map(([id,label]) => `<button class="nav-button ${activeView===id?"active":""}" data-nav="${id}" aria-current="${activeView===id?"page":"false"}"><span class="nav-icon">${icon(id)}</span>${label}</button>`).join("")}</nav>`;

  function homeView() {
    const p = profile();
    const total = p.accounts.reduce((sum, account) => sum + Number(account.amount), 0);
    const privacyClass = homeBalancesVisible ? "" : "masked";
    return `<section class="screen"><div class="topline"><h1 class="brand">Monetra</h1><button class="privacy-toggle" data-action="toggle-home-balances" aria-label="${homeBalancesVisible?"Hide":"Show"} Home balances" aria-pressed="${homeBalancesVisible}">${icon(homeBalancesVisible?"eye":"eye-off")}</button></div>
      <h2 class="welcome">Welcome, ${esc(p.profileInfo.displayName)}</h2><p class="caption">${esc(p.profileInfo.caption)}</p>
      <div class="balance-card"><div class="balance-copy"><div class="balance-label">Total Balance</div><div class="balance private-amount ${privacyClass}" data-balance="${money(total)}" aria-label="${homeBalancesVisible?money(total):"Balance hidden"}">${homeBalancesVisible?money(total):hiddenBalance}</div></div><img class="balance-wallet" src="assets/wallet-balance.png" alt="" aria-hidden="true"></div>
      <div class="section-head"><h3 class="section-title">Accounts</h3><button class="btn small" data-action="add-account">${icon("plus")}Add Account</button></div>
      <div class="card-list">${p.accounts.map(account => {const balance=money(account.amount);return `<button class="list-card" data-action="edit-account" data-id="${account.id}">${accountTag(account)}<span class="row-copy"><span class="row-title">${esc(account.title)}</span><span class="row-value private-amount ${privacyClass}" data-balance="${balance}" aria-label="${homeBalancesVisible?balance:"Balance hidden"}">${homeBalancesVisible?balance:hiddenBalance}</span></span>${icon("chevron","chevron")}</button>`;}).join("")}</div></section>`;
  }
  function valueView() {
    return `<section class="screen"><div class="section-head"><div><h1 class="page-title">Worth it?</h1><p class="subtitle">See how much your items cost per day</p></div><button class="btn small" data-action="add-value">${icon("plus")}Add</button></div>
      <div class="select-row"><label for="value-sort">Sort by</label><select id="value-sort"><option value="latest">Latest</option><option value="cost">Cost</option><option value="best">Best Value</option></select></div>
      <div id="value-list" class="card-list"></div></section>`;
  }
  function sortedValues(sort = "latest") {
    const items = [...profile().valueItems];
    if (sort === "cost") return items.sort((a,b)=>b.purchaseCost-a.purchaseCost);
    if (sort === "best") return items.sort((a,b)=>(a.purchaseCost/ownershipDays(a.purchaseDate))-(b.purchaseCost/ownershipDays(b.purchaseDate)));
    return items.sort((a,b)=>b.purchaseDate.localeCompare(a.purchaseDate));
  }
  function renderValueList(sort = "latest") {
    const root = document.querySelector("#value-list"); if (!root) return;
    const items = sortedValues(sort);
    root.innerHTML = items.length ? items.map(item => `<button class="list-card" data-action="view-value" data-id="${item.id}">${iconBubble(item.icon)}<span class="row-copy"><span class="row-title">${esc(item.name)}</span><span class="value-rate">${money(item.purchaseCost/ownershipDays(item.purchaseDate))} per day</span><span class="meta">${displayDate(item.purchaseDate)} · ${money(item.purchaseCost)} · ${ownershipDays(item.purchaseDate)} days</span></span>${icon("chevron","chevron")}</button>`).join("") : `<div class="empty-card subtle-empty"><strong>No Value items yet</strong>Add a purchase to see its daily value.</div>`;
  }
  function vehicleData(vehicle) {
    if (!vehicle.purchaseMonth || !vehicle.loanTotal || !vehicle.monthlyPayment) return null;
    const [year,month] = vehicle.purchaseMonth.split("-").map(Number);
    const now = new Date();
    const elapsedEligibleMonths = Math.max(0, (now.getFullYear()-year)*12 + now.getMonth()-(month-1));
    const naturalPayoffMonth = Math.ceil(vehicle.loanTotal / vehicle.monthlyPayment);
    const finalMonth = naturalPayoffMonth;
    const currentMonthIndex = Math.min(elapsedEligibleMonths, finalMonth);
    const balanceAt = index => index >= finalMonth
      ? 0
      : Math.max(0, vehicle.loanTotal - index * vehicle.monthlyPayment);
    const points = Array.from({length:finalMonth+1},(_,index)=>({
      month:index,
      date:new Date(year,month-1+index,1),
      balance:balanceAt(index)
    }));
    return {
      loanTotal:vehicle.loanTotal,
      paymentsMade:currentMonthIndex,
      remaining:Math.max(0,finalMonth-currentMonthIndex),
      balance:balanceAt(currentMonthIndex),
      points,
      current:currentMonthIndex,
      startDate:points[0].date,
      endDate:points[points.length-1].date
    };
  }
  function graphSvg(data) {
    const width=360,height=220,left=58,right=12,top=13,bottom=45;
    const plotWidth=width-left-right,plotHeight=height-top-bottom,last=Math.max(data.points.length-1,1);
    const x=index=>left+(index/last)*plotWidth;
    const y=balance=>top+(1-balance/data.loanTotal)*plotHeight;
    const xy=point=>[x(point.month),y(point.balance)];
    const linePath=data.points.map((point,index)=>`${index?"L":"M"}${xy(point).join(" ")}`).join(" ");
    const currentPoint=data.points[data.current],current=xy(currentPoint);
    const formatMonth=date=>new Intl.DateTimeFormat("en-US",{month:"short",year:"numeric"}).format(date);
    const compactPrice=value=>value===0?"$0":value>=1000000?`$${(value/1000000).toFixed(value%1000000?1:0)}m`:value>=1000?`$${(value/1000).toFixed(value%1000?1:0)}k`:`$${Math.round(value)}`;
    const yTicks=[0,.25,.5,.75,1].map(ratio=>data.loanTotal*ratio);
    const midIndex=Math.round(last/2);
    const xTicks=[0,midIndex,last].filter((value,index,array)=>array.indexOf(value)===index);
    return `<svg class="graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="Loan balance from ${formatMonth(data.startDate)} to ${formatMonth(data.endDate)}. Current balance ${money(data.balance)} at ${formatMonth(currentPoint.date)}.">
      ${yTicks.map(value=>`<line class="grid-line" x1="${left}" y1="${y(value)}" x2="${width-right}" y2="${y(value)}"/><text class="axis-label" x="${left-7}" y="${y(value)+3}" text-anchor="end">${compactPrice(value)}</text>`).join("")}
      <line class="axis-line" x1="${left}" y1="${top}" x2="${left}" y2="${height-bottom}"/><line class="axis-line" x1="${left}" y1="${height-bottom}" x2="${width-right}" y2="${height-bottom}"/>
      ${xTicks.map(index=>`<line class="grid-line" x1="${x(index)}" y1="${top}" x2="${x(index)}" y2="${height-bottom}"/><text class="axis-label" x="${x(index)}" y="${height-25}" text-anchor="${index===0?"start":index===last?"end":"middle"}">${formatMonth(data.points[index].date)}</text>`).join("")}
      <path class="loan-line" d="${linePath}"/><circle class="progress-halo" cx="${current[0]}" cy="${current[1]}" r="10"/><circle class="progress-dot" cx="${current[0]}" cy="${current[1]}" r="5"/>
      <text class="current-label" x="${current[0]>width-72?current[0]-7:current[0]+7}" y="${Math.max(top+9,current[1]-9)}" text-anchor="${current[0]>width-72?"end":"start"}">${money(data.balance)}</text>
      <text class="axis-label" x="${left+plotWidth/2}" y="${height-5}" text-anchor="middle">Month &amp; year</text><text class="axis-label" transform="translate(10 ${top+plotHeight/2}) rotate(-90)" text-anchor="middle">Loan balance</text>
    </svg>`;
  }
  function vehicleView() {
    const v=profile().vehicle,data=vehicleData(v),file=`Vehicle_${v.vehicleType}_${v.vehicleColour}.png`;
    return `<section class="screen"><h1 class="page-title">Vehicle</h1><p class="subtitle">Your vehicle loan at a glance.</p>
      ${data?`<div class="vehicle-visual"><img class="vehicle-image" src="assets/vehicles/${file}" onerror="this.src='assets/vehicles/Vehicle_SUV_White.png'" alt="${esc(v.vehicleColour)} ${esc(v.vehicleType)} placeholder"><div class="vehicle-name">${esc(v.name)}</div></div><div class="loan-panel"><div class="loan-grid"><div class="loan-stat"><span class="meta">Loan Balance</span><strong>${money(data.balance)}</strong></div><div class="loan-stat"><span class="meta">Loan Total</span><strong>${money(v.loanTotal)}</strong></div></div><h3 class="section-title">Loan Balance Over Time</h3>${graphSvg(data)}<div class="mini-grid"><div class="mini-stat"><span class="meta">Original Price</span><strong>${money(v.originalPrice)}</strong></div><div class="mini-stat"><span class="meta">Monthly Payment</span><strong>${money(v.monthlyPayment)}</strong></div><div class="mini-stat"><span class="meta">Payments Made</span><strong>${data.paymentsMade}</strong></div><div class="mini-stat"><span class="meta">Remaining</span><strong>${data.remaining} months</strong></div></div></div>`:`<div class="empty-card subtle-empty"><strong>No Data</strong>Configure your loan details to see the balance and graph.</div>`}
      <button class="btn full" style="margin-top:12px" data-action="edit-vehicle">${icon("edit")}Edit Vehicle</button></section>`;
  }
  const relativeActivity = date => { const days=calendarDays(isoToday(),date); return days>0?`In ${days} day${days===1?"":"s"}`:`${Math.abs(days)} day${Math.abs(days)===1?"":"s"} ago`; };
  function activityView() {
    const items=[...profile().activities], upcoming=items.filter(a=>a.date>isoToday()).sort((a,b)=>a.date.localeCompare(b.date)), past=items.filter(a=>a.date<=isoToday()).sort((a,b)=>b.date.localeCompare(a.date));
    const cards=(list,future)=>list.length?list.map(item=>`<button class="list-card" data-action="view-activity" data-id="${item.id}">${iconBubble(item.icon,future?"":"purple")}<span class="row-copy"><span class="row-title">${esc(item.name)}</span><span class="meta">${displayDate(item.date)}</span></span><span class="${future?"days-badge":"past-label"}">${relativeActivity(item.date)}</span></button>`).join(""):`<div class="empty-card subtle-empty"><strong>${future?"Nothing upcoming":"No past activities"}</strong>${future?"Add an activity when you have something planned.":"Completed activities will appear here."}</div>`;
    return `<section class="screen"><div class="section-head"><div><h1 class="page-title">Activities</h1><p class="subtitle">Keep track of noteworthy activities.</p></div><button class="btn small" data-action="add-activity">${icon("plus")}Add</button></div><h3 class="section-title">Upcoming</h3><div class="card-list">${cards(upcoming,true)}</div><h3 class="section-title">Past Activities</h3><div class="card-list">${cards(past,false)}</div></section>`;
  }
  function settingsView() {
    const p=profile(), profiles=Object.values(state.profiles);
    return `<section class="screen"><h1 class="page-title">Settings</h1><div class="settings-group"><h3 class="section-title">About Me</h3><div class="settings-card"><button class="setting-row" data-action="edit-profile-info">${iconBubble("user")}<span class="row-copy"><span class="row-title">My Profile</span><span class="meta">${esc(p.profileInfo.displayName)}</span></span>${icon("chevron","chevron")}</button></div></div>
      <div class="settings-group"><h3 class="section-title">Manage Profiles</h3><div class="settings-card">${profiles.map(item=>`<button class="setting-row" data-action="profile-menu" data-id="${item.id}">${iconBubble("user")}<span class="row-copy"><span class="row-title">${esc(item.profileInfo.displayName)}</span></span>${item.id===p.id?'<span class="current-tag">Current Profile</span>':icon("chevron","chevron")}</button>`).join("")}<button class="setting-row" data-action="add-profile">${iconBubble("plus")}<span class="row-title">Add New Profile</span>${icon("chevron","chevron")}</button></div></div>
      <div class="settings-group"><h3 class="section-title">Data</h3><div class="settings-card"><button class="setting-row" data-action="clear-data">${iconBubble("trash")}<span class="row-copy"><span class="row-title">Clear Data</span><span class="meta">Reset current profile to default values.</span></span>${icon("chevron","chevron")}</button></div></div>
      <div class="settings-group"><h3 class="section-title">About</h3><div class="settings-card"><div class="setting-row">${iconBubble("value")}<span class="row-copy"><span class="row-title">Monetra v2.0 Production</span></span></div></div></div></section>`;
  }
  function render() {
    const views={home:homeView,value:valueView,vehicle:vehicleView,activity:activityView,settings:settingsView};
    const nextScreen=(views[activeView]||homeView)();
    const currentScreen=$app.querySelector(".screen");
    if(currentScreen)currentScreen.outerHTML=nextScreen;
    else $app.insertAdjacentHTML("afterbegin",nextScreen);
    if(!$app.querySelector(".bottom-nav"))$app.insertAdjacentHTML("beforeend",nav());
    $app.querySelectorAll("[data-nav]").forEach(button=>{
      const selected=button.dataset.nav===activeView;
      button.classList.toggle("active",selected);
      button.setAttribute("aria-current",selected?"page":"false");
    });
    if(activeView==="value") renderValueList();
  }

  function updateHomeBalanceVisibility() {
    const toggle=$app.querySelector('[data-action="toggle-home-balances"]');
    if(toggle){toggle.innerHTML=icon(homeBalancesVisible?"eye":"eye-off");toggle.setAttribute("aria-label",`${homeBalancesVisible?"Hide":"Show"} Home balances`);toggle.setAttribute("aria-pressed",String(homeBalancesVisible));}
    $app.querySelectorAll(".private-amount").forEach(amount=>{const balance=amount.dataset.balance||"";amount.classList.toggle("masked",!homeBalancesVisible);amount.textContent=homeBalancesVisible?balance:hiddenBalance;amount.setAttribute("aria-label",homeBalancesVisible?balance:"Balance hidden");});
  }

  function iconPicker(selected) { return `<div class="field-label">Icon</div><div class="icon-grid">${config.availableIcons.map(name=>`<button type="button" class="icon-option ${name===selected?"selected":""}" data-icon="${name}" aria-label="${name}">${icon(name)}</button>`).join("")}</div><input type="hidden" name="icon" value="${esc(selected||config.availableIcons[0])}">`; }
  function accountTagPicker(selected) { const current=config.accountTagColours.includes(selected)?selected:config.accountTagColours[0];return `<div class="field-label">Colour Tag</div><div class="tag-grid">${config.accountTagColours.map((colour,index)=>`<button type="button" class="tag-option ${colour===current?"selected":""}" style="--tag-colour:${colour};--tag-tint:${colour}22" data-tag-color="${colour}" aria-label="Colour tag ${index+1}"><span class="tag-swatch" aria-hidden="true"></span></button>`).join("")}</div><input type="hidden" name="tagColor" value="${current}">`; }
  function bindForm(form, callback) { form.addEventListener("submit", event=>{event.preventDefault();const data=Object.fromEntries(new FormData(form));callback(data,form);}); }
  function validation(form, rules) { let ok=true; form.querySelectorAll(".field-error").forEach(e=>e.textContent=""); for(const [name,message,test] of rules){const input=form.elements[name];if(!test(input.value)){input.closest(".field")?.querySelector(".field-error")?.append(message);input.focus();ok=false;break;}}return ok; }
  function accountModal(id) {
    const existing=profile().accounts.find(a=>a.id===id), editing=Boolean(existing);
    showModal(`${modalHead(editing?"Edit Account":"Add Account")}<form id="account-form"><div class="field"><label>Account Title<input name="title" value="${esc(existing?.title||"")}" placeholder="e.g. Main Account" required></label><span class="field-error"></span></div><div class="field"><label>Amount<input name="amount" type="number" min="0" step="0.01" value="${existing?.amount??""}" placeholder="0.00" required></label><span class="field-error"></span></div>${accountTagPicker(existing?.tagColor)}${editing?`<button class="btn danger full" type="button" data-delete-account="${id}">${icon("trash")}Delete Account</button>`:""}${formActions()}</form>`);
    bindForm(document.querySelector("#account-form"),data=>{const f=document.querySelector("#account-form");if(!validation(f,[["title","Enter an account title.",v=>v.trim().length>0],["amount","Enter a non-negative amount.",v=>v!==""&&Number(v)>=0]]))return;const record={id:existing?.id||uid("account"),title:data.title.trim(),amount:Number(data.amount),icon:"money",tagColor:config.accountTagColours.includes(data.tagColor)?data.tagColor:config.accountTagColours[0]};if(editing)Object.assign(existing,record);else profile().accounts.push(record);commit(editing?"Account updated":"Account added");});
  }
  function valueModal(id) {
    const existing=profile().valueItems.find(a=>a.id===id),editing=Boolean(existing),selected=existing?.icon||"laptop";
    showModal(`${modalHead(editing?"Edit Item":"Add Item")}<form id="value-form"><div class="field"><label>Item Name<input name="name" value="${esc(existing?.name||"")}" placeholder="e.g. Laptop" required></label><span class="field-error"></span></div><div class="field"><label>Purchase Cost<input name="purchaseCost" type="number" min="0" step="0.01" value="${existing?.purchaseCost??""}" placeholder="0.00" required></label><span class="field-error"></span></div><div class="field"><label>Date of Purchase<input name="purchaseDate" type="date" max="${isoToday()}" value="${existing?.purchaseDate||isoToday()}" required></label><span class="field-error"></span></div>${iconPicker(selected)}${formActions()}</form>`);
    bindForm(document.querySelector("#value-form"),data=>{const f=document.querySelector("#value-form");if(!validation(f,[["name","Enter an item name.",v=>v.trim().length>0],["purchaseCost","Enter a non-negative cost.",v=>v!==""&&Number(v)>=0],["purchaseDate","Choose today or an earlier date.",v=>v&&v<=isoToday()]]))return;const record={id:existing?.id||uid("value"),name:data.name.trim(),purchaseCost:Number(data.purchaseCost),purchaseDate:data.purchaseDate,icon:data.icon};if(editing)Object.assign(existing,record);else profile().valueItems.push(record);commit(editing?"Item updated":"Item added");});
  }
  function valueDetail(id) { const item=profile().valueItems.find(a=>a.id===id);if(!item)return;showModal(`${modalHead("Item Detail")}<div class="detail-hero">${iconBubble(item.icon)}<h2>${esc(item.name)}</h2><div class="detail-rate">${money(item.purchaseCost/ownershipDays(item.purchaseDate))} per day</div></div><div class="detail-grid"><div class="detail-line"><span>Purchase Date</span><strong>${displayDate(item.purchaseDate)}</strong></div><div class="detail-line"><span>Purchase Cost</span><strong>${money(item.purchaseCost)}</strong></div><div class="detail-line"><span>Ownership</span><strong>${ownershipDays(item.purchaseDate)} days</strong></div></div><div class="actions"><button class="btn" data-edit-value="${id}">${icon("edit")}Edit</button><button class="btn danger" data-delete-value="${id}">${icon("trash")}Delete</button></div>`); }
  function activityModal(id) {
    const existing=profile().activities.find(a=>a.id===id),editing=Boolean(existing),selected=existing?.icon||"wrench";
    showModal(`${modalHead(editing?"Edit Activity":"Add Activity")}<form id="activity-form"><div class="field"><label>Activity Name<input name="name" value="${esc(existing?.name||"")}" placeholder="e.g. Car Servicing" required></label><span class="field-error"></span></div><div class="field"><label>Date<input name="date" type="date" value="${existing?.date||isoToday()}" required></label><span class="field-error"></span></div><div class="field"><label>Notes (Optional)<textarea name="notes" placeholder="Details, location, etc.">${esc(existing?.notes||"")}</textarea></label><span class="field-error"></span></div>${iconPicker(selected)}${formActions()}</form>`);
    bindForm(document.querySelector("#activity-form"),data=>{const f=document.querySelector("#activity-form");if(!validation(f,[["name","Enter an activity name.",v=>v.trim().length>0],["date","Choose a valid date.",v=>/^\d{4}-\d{2}-\d{2}$/.test(v)]]))return;const record={id:existing?.id||uid("activity"),name:data.name.trim(),date:data.date,notes:data.notes.trim(),icon:data.icon};if(editing)Object.assign(existing,record);else profile().activities.push(record);commit(editing?"Activity updated":"Activity added");});
  }
  function activityDetail(id) { const item=profile().activities.find(a=>a.id===id);if(!item)return;showModal(`${modalHead("Activity Detail")}<div class="detail-hero">${iconBubble(item.icon)}<h2>${esc(item.name)}</h2><div class="days-badge" style="display:inline-block">${relativeActivity(item.date)}</div></div><div class="detail-grid"><div class="detail-line"><span>Date</span><strong>${displayDate(item.date)}</strong></div>${item.notes?`<div class="detail-line"><span>Notes</span><strong>${esc(item.notes)}</strong></div>`:""}</div><div class="actions"><button class="btn" data-edit-activity="${id}">${icon("edit")}Edit</button><button class="btn danger" data-delete-activity="${id}">${icon("trash")}Delete</button></div>`); }
  function vehicleModal() {
    const v=profile().vehicle;
    const [purchaseYear = "", purchaseMonthNumber = ""] = v.purchaseMonth.split("-");
    const currentYear = new Date().getFullYear();
    const earliestYear = Math.min(1900, Number(purchaseYear) || 1900);
    const years = Array.from({length: currentYear - earliestYear + 1}, (_, index) => currentYear - index);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    showModal(`<div class="vehicle-modal-sticky">${modalHead("Edit Vehicle")}<img class="modal-preview" id="vehicle-preview" src="assets/vehicles/Vehicle_${v.vehicleType}_${v.vehicleColour}.png" onerror="this.src='assets/vehicles/Vehicle_SUV_White.png'" alt="Vehicle preview"></div><form id="vehicle-form"><div class="field-label">Vehicle Type</div><div class="segmented" data-segments="vehicleType">${config.vehicleTypes.map(type=>`<button type="button" class="segment ${type===v.vehicleType?"selected":""}" data-value="${type}">${type}</button>`).join("")}</div><input type="hidden" name="vehicleType" value="${v.vehicleType}"><div class="field-label" style="margin-top:14px">Colour</div><div class="segmented" data-segments="vehicleColour">${config.vehicleColours.map(colour=>`<button type="button" class="colour-dot ${colour===v.vehicleColour?"selected":""}" style="background:${colour.toLowerCase()}" data-value="${colour}" aria-label="${colour}"></button>`).join("")}</div><input type="hidden" name="vehicleColour" value="${v.vehicleColour}"><div class="field"><label>Vehicle Name<input name="name" value="${esc(v.name)}" required></label><span class="field-error"></span></div><div class="field"><label>Original Price<input name="originalPrice" type="number" min="0" step="0.01" value="${v.originalPrice||""}" placeholder="0.00"></label><span class="field-error"></span></div><div class="field"><label>Loan Total<input name="loanTotal" type="number" min="0" step="0.01" value="${v.loanTotal||""}" placeholder="0.00"></label><span class="field-error"></span></div><div class="vehicle-date-row"><div class="field"><label>Purchase Year<select name="purchaseYear"><option value="">Select year</option>${years.map(year=>`<option value="${year}" ${String(year)===purchaseYear?"selected":""}>${year}</option>`).join("")}</select></label><span class="field-error"></span></div><div class="field"><label>Purchase Month<select name="purchaseMonthNumber"><option value="">Select month</option>${months.map((month,index)=>{const value=String(index+1).padStart(2,"0");return `<option value="${value}" ${value===purchaseMonthNumber?"selected":""}>${month}</option>`;}).join("")}</select></label><span class="field-error"></span></div></div><div class="field"><label>Monthly Payment<input name="monthlyPayment" type="number" min="0" step="0.01" value="${v.monthlyPayment||""}" placeholder="0.00"></label><span class="field-error"></span></div>${formActions()}</form>`);
    bindForm(document.querySelector("#vehicle-form"),data=>{const f=document.querySelector("#vehicle-form");const purchaseMonth=data.purchaseYear&&data.purchaseMonthNumber?`${data.purchaseYear}-${data.purchaseMonthNumber}`:"";if(!validation(f,[["name","Enter a vehicle name.",x=>x.trim().length>0],["originalPrice","Enter a non-negative price.",x=>x===""||Number(x)>=0],["loanTotal","Enter a non-negative loan total.",x=>x===""||Number(x)>=0],["purchaseYear","Choose a year or clear the month.",x=>Boolean(x)||!data.purchaseMonthNumber],["purchaseMonthNumber","Choose a month or clear the year.",x=>Boolean(x)||!data.purchaseYear],["purchaseMonthNumber","Choose the current month or earlier.",()=>purchaseMonth===""||purchaseMonth<=isoToday().slice(0,7)],["monthlyPayment","Enter a non-negative payment.",x=>x===""||Number(x)>=0]]))return;Object.assign(v,{name:data.name.trim(),originalPrice:Number(data.originalPrice||0),loanTotal:Number(data.loanTotal||0),purchaseMonth,monthlyPayment:Number(data.monthlyPayment||0),vehicleType:data.vehicleType,vehicleColour:data.vehicleColour});commit("Vehicle updated");});
  }
  function profileInfoModal() { const info=profile().profileInfo;showModal(`${modalHead("About Me")}<form id="profile-info-form"><div class="field"><label>Display Name<input name="displayName" value="${esc(info.displayName)}" required></label><span class="field-error"></span></div><div class="field"><label>Caption<input name="caption" value="${esc(info.caption)}"></label><span class="field-error"></span></div>${formActions()}</form>`);bindForm(document.querySelector("#profile-info-form"),data=>{const f=document.querySelector("#profile-info-form");if(!validation(f,[["displayName","Enter a display name.",v=>v.trim().length>0]]))return;info.displayName=data.displayName.trim();info.caption=data.caption.trim();commit("Profile updated");}); }
  function addProfileModal() { showModal(`${modalHead("Add New Profile")}<form id="add-profile-form"><div class="field"><label>Display Name<input name="displayName" placeholder="e.g. Alex" required></label><span class="field-error"></span></div>${formActions("Create Profile")}</form>`);bindForm(document.querySelector("#add-profile-form"),data=>{const f=document.querySelector("#add-profile-form");if(!validation(f,[["displayName","Enter a display name.",v=>v.trim().length>0]]))return;const next=createDefaultProfile(undefined,data.displayName.trim());state.profiles[next.id]=next;state.currentProfileId=next.id;commit("Profile created");}); }
  function profileMenu(id) { const item=state.profiles[id],current=id===state.currentProfileId;showModal(`${modalHead(esc(item.profileInfo.displayName))}<p class="confirm-copy">${current?"This is your current profile.":"Switch to this profile to view its separate accounts, Value items, vehicle and activities."}</p>${current?"":`<button class="btn full" data-switch-profile="${id}">Switch Profile</button>`}<div class="danger-zone"><button class="btn danger full" data-request-delete-profile="${id}" ${Object.keys(state.profiles).length===1?"disabled":""}>${icon("trash")}Delete Profile</button>${Object.keys(state.profiles).length===1?'<p class="meta">The last remaining profile cannot be deleted.</p>':""}</div>`); }
  function confirmModal(title,copy,confirmLabel,action,id="") { showModal(`${modalHead(title)}<p class="confirm-copy">${esc(copy)}</p><div class="actions"><button class="btn ghost" data-close>Cancel</button><button class="btn danger" data-confirm="${action}" data-id="${id}">${esc(confirmLabel)}</button></div>`); }
  function removeRecord(collection,id,message){profile()[collection]=profile()[collection].filter(item=>item.id!==id);commit(message);}

  document.addEventListener("click", event => {
    const navButton=event.target.closest("[data-nav]"); if(navButton){activeView=navButton.dataset.nav;render();scrollTo(0,0);return;}
    if(event.target.matches("[data-dismiss]")||event.target.closest("[data-close]")){closeModal();return;}
    const iconBtn=event.target.closest("[data-icon]");if(iconBtn){const form=iconBtn.closest("form");form.querySelectorAll("[data-icon]").forEach(b=>b.classList.remove("selected"));iconBtn.classList.add("selected");form.elements.icon.value=iconBtn.dataset.icon;return;}
    const tagBtn=event.target.closest("[data-tag-color]");if(tagBtn){const form=tagBtn.closest("form");form.querySelectorAll("[data-tag-color]").forEach(b=>b.classList.remove("selected"));tagBtn.classList.add("selected");form.elements.tagColor.value=tagBtn.dataset.tagColor;return;}
    const segment=event.target.closest("[data-segments] [data-value]");if(segment){const group=segment.parentElement,name=group.dataset.segments,form=segment.closest("form");group.querySelectorAll("[data-value]").forEach(b=>b.classList.remove("selected"));segment.classList.add("selected");form.elements[name].value=segment.dataset.value;const type=form.elements.vehicleType.value,colour=form.elements.vehicleColour.value;document.querySelector("#vehicle-preview").src=`assets/vehicles/Vehicle_${type}_${colour}.png`;return;}
    const action=event.target.closest("[data-action]")?.dataset.action,id=event.target.closest("[data-id]")?.dataset.id;
    if(action==="toggle-home-balances"){homeBalancesVisible=!homeBalancesVisible;updateHomeBalanceVisibility();return;}
    if(action==="add-account")accountModal();if(action==="edit-account")accountModal(id);if(action==="add-value")valueModal();if(action==="view-value")valueDetail(id);if(action==="edit-vehicle")vehicleModal();if(action==="add-activity")activityModal();if(action==="view-activity")activityDetail(id);if(action==="edit-profile-info")profileInfoModal();if(action==="add-profile")addProfileModal();if(action==="profile-menu")profileMenu(id);if(action==="clear-data")confirmModal("Clear Data","This permanently resets every item in the current profile to its default values.","Clear Data","clear-data");
    const editValue=event.target.closest("[data-edit-value]");if(editValue)valueModal(editValue.dataset.editValue);
    const delValue=event.target.closest("[data-delete-value]");if(delValue)confirmModal("Delete Item","This Value item will be permanently removed.","Delete","delete-value",delValue.dataset.deleteValue);
    const editActivity=event.target.closest("[data-edit-activity]");if(editActivity)activityModal(editActivity.dataset.editActivity);
    const delActivity=event.target.closest("[data-delete-activity]");if(delActivity)confirmModal("Delete Activity","This activity will be permanently removed.","Delete","delete-activity",delActivity.dataset.deleteActivity);
    const delAccount=event.target.closest("[data-delete-account]");if(delAccount)confirmModal("Delete Account","This account will be permanently removed.","Delete","delete-account",delAccount.dataset.deleteAccount);
    const switchProfile=event.target.closest("[data-switch-profile]");if(switchProfile){state.currentProfileId=switchProfile.dataset.switchProfile;commit("Profile switched");}
    const requestDelete=event.target.closest("[data-request-delete-profile]");if(requestDelete&&!requestDelete.disabled)confirmModal("Delete Profile","This permanently removes the profile and all of its data.","Delete Profile","delete-profile",requestDelete.dataset.requestDeleteProfile);
    const confirm=event.target.closest("[data-confirm]");if(confirm){const action=confirm.dataset.confirm,target=confirm.dataset.id;if(action==="delete-value")removeRecord("valueItems",target,"Item deleted");if(action==="delete-activity")removeRecord("activities",target,"Activity deleted");if(action==="delete-account")removeRecord("accounts",target,"Account deleted");if(action==="clear-data"){const id=profile().id;state.profiles[id]=createDefaultProfile(id);commit("Profile reset");}if(action==="delete-profile"&&Object.keys(state.profiles).length>1){delete state.profiles[target];if(state.currentProfileId===target)state.currentProfileId=Object.keys(state.profiles)[0];commit("Profile deleted");}}
  });
  document.addEventListener("change",event=>{if(event.target.id==="value-sort")renderValueList(event.target.value);});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&$modal.innerHTML)closeModal();});

  async function configureEnvironment(){
    if(isProduction && "serviceWorker" in navigator) await navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" });
    if(!isProduction && "serviceWorker" in navigator){const registrations=await navigator.serviceWorker.getRegistrations();await Promise.all(registrations.filter(reg=>reg.scope===new URL("./",location.href).href).map(reg=>reg.unregister()));if("caches" in window){const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith("monetra-")).map(key=>caches.delete(key)));}}
  }
  function registerWebMcp(){
    const context=document.modelContext;if(!context?.registerTool)return;
    const tools=[
      {name:"add_monetra_account",title:"Add Monetra account",description:"Add a non-negative account balance to the current Monetra profile.",inputSchema:{type:"object",properties:{title:{type:"string"},amount:{type:"number",minimum:0},icon:{type:"string",enum:config.availableIcons}},required:["title","amount"],additionalProperties:false},execute:input=>{if(!input.title?.trim()||input.amount<0)throw new Error("Valid title and non-negative amount required.");const record={id:uid("account"),title:input.title.trim(),amount:Number(input.amount),icon:config.availableIcons.includes(input.icon)?input.icon:"house"};profile().accounts.push(record);saveState();render();return record;}},
      {name:"add_monetra_activity",title:"Add Monetra activity",description:"Add a dated activity to the current Monetra profile.",inputSchema:{type:"object",properties:{name:{type:"string"},date:{type:"string",pattern:"^\\d{4}-\\d{2}-\\d{2}$"},notes:{type:"string"},icon:{type:"string",enum:config.availableIcons}},required:["name","date"],additionalProperties:false},execute:input=>{if(!input.name?.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(input.date))throw new Error("Valid name and ISO date required.");const record={id:uid("activity"),name:input.name.trim(),date:input.date,notes:(input.notes||"").trim(),icon:config.availableIcons.includes(input.icon)?input.icon:"package"};profile().activities.push(record);saveState();render();return record;}}
    ];
    tools.forEach(tool=>{try{context.registerTool({...tool,annotations:{readOnlyHint:false,untrustedContentHint:false}});}catch(error){console.warn("WebMCP tool registration failed.",error);}});
  }
  render();configureEnvironment().catch(console.warn);registerWebMcp();
})();
