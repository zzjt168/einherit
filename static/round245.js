/* 电子继承 · 第二百四十五批增量（叠在 round245…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round245SoftBanner_" + (hostId || "home");
    let el = document.getElementById(eid);
    if (!el) {
      el = document.createElement("div");
      el.id = eid;
      el.className = "ok soft-banner soft-banner-cta";
      el.hidden = true;
    }
    if (!el.parentNode || el.parentNode !== host) {
      host.insertBefore(el, host.firstChild);
    }
    el.innerHTML = "";
    const text = document.createElement("span");
    text.textContent = msg;
    el.appendChild(text);
    (actions || []).forEach((a) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm";
      btn.textContent = a.label;
      btn.onclick = (e) => {
        e.preventDefault();
        if (typeof a.onClick === "function") a.onClick();
      };
      el.appendChild(btn);
    });
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.hidden = true;
    }, 9000);
    return el;
  }

  async function copyText(str) {
    const text = String(str || "");
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return !!ok;
    } catch (_) {
      return false;
    }
  }

  function truthyFlag(v) {
    return v === true || v === 1 || v === "1";
  }

  function collectRoundLayers() {
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const found = [];
    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const m = src.match(/round(\d+)\.js/i);
      if (m) found.push(Number(m[1]));
    });
    return Array.from(new Set(found)).sort((a, b) => a - b);
  }

  /* 1 · 首页域名+英文品牌+中文品牌冷静条 */
  async function paintHomeDomainBrandEnBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainBrandEnBrandCalmBarR245");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBrandEnBrandCalmBarR245";
      bar.className = "home-domain-brand-en-brand-calm-r245";
      bar.setAttribute("role", "status");
      const prev = $("#homeOkBrandVersionCalmBarR244");
      const prev2 = $("#homeBrandEnDomainOkCalmBarR243");
      const prev3 = $("#homeVersionDomainBrandCalmBarR242");
      if (prev && prev.parentNode === home)
        prev.insertAdjacentElement("afterend", bar);
      else if (prev2 && prev2.parentNode === home)
        prev2.insertAdjacentElement("afterend", bar);
      else if (prev3 && prev3.parentNode === home)
        prev3.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const brandEn = String(h.brand_en || h.brandEn || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = domain + " · " + brandEn + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-brand-calm-r245-mark">域名</span>
        <span class="muted home-domain-brand-en-brand-calm-r245-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnBrandCalmGoR245">去设置</button>`;
      const btn = $("#homeDomainBrandEnBrandCalmGoR245");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-brand-calm-r245-mark">域名</span>
        <span class="muted home-domain-brand-en-brand-calm-r245-sub">域名英文中文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnBrandCalmGoR245">去设置</button>`;
      const btn = $("#homeDomainBrandEnBrandCalmGoR245");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置+设备归属+标题组合复制（四十五进位） */
  async function ensureLegacyDispositionDeviceOwnerTitleCopyButtons() {
    const list = $("#lgList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/legacy");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#lgList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      if (!it) return;
      const title = String(it.title || "").trim() || "无标题";
      const disposition =
        String(it.disposition || it.action || it.intent || "").trim() ||
        "未填处置";
      const deviceOwner =
        String(it.device_owner || it.owner || it.belong_to || "").trim() ||
        "未填归属";
      const line = disposition + " · " + deviceOwner + " · " + title;
      el.dataset.dispositionDeviceOwnerTitleR245 = line;
      if (el.querySelector(".lg-copy-disposition-device-owner-title-r245")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-disposition-device-owner-title-r245";
      btn.textContent = "复制处置归属标题R245";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.dispositionDeviceOwnerTitleR245 || "");
        softBanner(ok ? "已复制处置归属标题R245" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+标签+摘要组合复制（四十五进位） */
  async function ensureAssetVisibilityTagSummaryCopyButtons() {
    const list = $("#asList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/assets");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#asList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      if (!it) return;
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const tag = String(it.tag || it.tags || it.label || "").trim() || "无标签";
      const line = visibility + " · " + tag + " · " + summary;
      el.dataset.visibilityTagSummaryR245 = line;
      if (el.querySelector(".as-copy-visibility-tag-summary-r245")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-tag-summary-r245";
      btn.textContent = "复制可见性标签摘要R245";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.visibilityTagSummaryR245 || ""
        );
        softBanner(ok ? "已复制可见性标签摘要R245" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态+上次距今+下次建议（四十五进位） */
  async function ensureCheckinStatusLastAgoNextSuggestedPlainR245Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusLastAgoNextSuggestedPlainR245CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusLastAgoNextSuggestedPlainR245CopyCard";
      card.className =
        "checkin-status-last-ago-next-suggested-plain-r245-copy";
      const prevCk = $(
        "#checkinLastAgoNextSuggestedStatusPlainR244CopyCard"
      );
      const prevCk2 = $(
        "#checkinNextSuggestedStatusLastAgoPlainR243CopyCard"
      );
      const prevCk3 = $(
        "#checkinStatusLastAgoNextSuggestedPlainR242CopyCard"
      );
      if (prevCk && prevCk.parentNode)
        prevCk.insertAdjacentElement("afterend", card);
      else if (prevCk2 && prevCk2.parentNode)
        prevCk2.insertAdjacentElement("afterend", card);
      else if (prevCk3 && prevCk3.parentNode)
        prevCk3.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const user = st.user || {};
      const nextAt =
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const status =
        String(
          st.status ||
            cd.status ||
            user.status ||
            st.status_label ||
            cd.status_label ||
            ""
        ).trim() || "暂无状态";
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            st.last_ago ||
            cd.last_ago ||
            ""
        ).trim() || "暂无上次距今";
      const combo = status + " · " + lastAgo + " · " + nextAt;
      const line =
        "报备状态 · 上次距今 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-last-ago-next-suggested-plain-r245-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusLastAgoNextSuggestedPlainR245CopyBtn">复制状态距今下次R245</button>`;
      const btn = $("#checkinStatusLastAgoNextSuggestedPlainR245CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态距今下次R245" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距今下次状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+已存+余额三元复制（四十五进位） */
  async function ensureTravelThresholdDepositedBalancePlainR245Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdDepositedBalancePlainR245CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdDepositedBalancePlainR245CopyCard";
      card.className = "travel-threshold-deposited-balance-plain-r245-copy";
      const prevTr = $(
        "#travelDepositedBalanceThresholdPlainR244CopyCard"
      );
      const prevTr2 = $(
        "#travelBalanceThresholdDepositedPlainR243CopyCard"
      );
      const prevTr3 = $(
        "#travelThresholdDepositedBalancePlainR242CopyCard"
      );
      if (prevTr && prevTr.parentNode)
        prevTr.insertAdjacentElement("afterend", card);
      else if (prevTr2 && prevTr2.parentNode)
        prevTr2.insertAdjacentElement("afterend", card);
      else if (prevTr3 && prevTr3.parentNode)
        prevTr3.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const deposited =
        fund.deposited == null
          ? fund.balance == null
            ? "—"
            : String(Math.round(Number(fund.balance)))
          : String(Math.round(Number(fund.deposited)));
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const threshold =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = threshold + " · " + deposited + " · " + balance;
      const line =
        "差旅门槛 · 已存 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-deposited-balance-plain-r245-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdDepositedBalancePlainR245CopyBtn">复制门槛已存余额R245</button>`;
      const btn = $("#travelThresholdDepositedBalancePlainR245CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛已存余额R245" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额门槛已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+城市+科室组合复制（四十五进位） */
  async function ensureAftercareHospitalCityDepartmentCopyButtonsR245() {
    const list = $("#acList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/aftercare");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#acList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      if (!it) return;
      const city = String(it.city || "").trim() || "未填城市";
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const line = hospital + " · " + city + " · " + department;
      el.dataset.hospitalCityDepartmentR245 = line;
      if (el.querySelector(".ac-copy-hospital-city-department-r245"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-hospital-city-department-r245";
      btn.textContent = "复制医院城市科室R245";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.hospitalCityDepartmentR245 || ""
        );
        softBanner(ok ? "已复制医院城市科室R245" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+就绪+时长提示组合复制（四十五进位） */
  async function ensureAuthCompleteReadyDurationHintCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteReadyDurationHintCopyR245Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteReadyDurationHintCopyR245Card";
      card.className = "av-complete-ready-duration-hint-copy-r245";
      const prevAv = $("#avDurationHintCompleteReadyCopyR244Card");
      const prevAv2 = $("#avReadyDurationHintCompleteCopyR243Card");
      const prevAv3 = $("#avCompleteReadyDurationHintCopyR242Card");
      if (prevAv && prevAv.parentNode)
        prevAv.insertAdjacentElement("afterend", card);
      else if (prevAv2 && prevAv2.parentNode)
        prevAv2.insertAdjacentElement("afterend", card);
      else if (prevAv3 && prevAv3.parentNode)
        prevAv3.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const ready = truthyFlag(
        data.ready != null
          ? data.ready
          : prog.ready != null
            ? prog.ready
            : data.complete
      )
        ? "已就绪"
        : "未就绪";
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : latest.complete != null
              ? latest.complete
              : data.ready
      )
        ? "已完成"
        : "未完成";
      const combo = complete + " · " + ready + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-ready-duration-hint-copy-r245-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteReadyDurationHintCopyR245Btn">复制完成就绪时长R245</button>`;
      const btn = $("#avCompleteReadyDurationHintCopyR245Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成就绪时长R245" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长完成就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+关系+联系方式组合复制（四十五进位） */
  async function ensureHeirNameRelationContactCopyButtonsR245() {
    const box = $("#heirsBox");
    if (!box) return;
    let items = [];
    try {
      const data = await api("/api/beneficiaries");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const nodes = $$("#heirsBox .item").filter((el) => el.querySelector("strong"));
    nodes.forEach((el, i) => {
      const it = items[i];
      if (!it || it.id == null) return;
      const relation =
        String(it.relation || it.role || "").trim() || "未填关系";
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const name = String(it.name || "").trim() || "未填姓名";
      const line = name + " · " + relation + " · " + contact;
      if (el.querySelector(".bn-copy-name-relation-contact-r245")) return;
      el.dataset.nameRelationContactR245 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-relation-contact-r245";
      btn.textContent = "复制姓名关系联系R245";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRelationContactR245 || "");
        softBanner(ok ? "已复制姓名关系联系R245" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+域名+进度百分比组合复制（四十五进位） */
  async function ensureHandoverDoneDomainProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneDomainProgressPctCopyR245Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneDomainProgressPctCopyR245Card";
      card.className = "hand-done-domain-progress-pct-copy-r245";
      const prevHand = $("#handProgressPctDoneDomainCopyR244Card");
      const prevHand2 = $("#handDomainProgressPctDoneCopyR243Card");
      const prevHand3 = $("#handDoneDomainProgressPctCopyR242Card");
      if (prevHand && prevHand.parentNode)
        prevHand.insertAdjacentElement("afterend", card);
      else if (prevHand2 && prevHand2.parentNode)
        prevHand2.insertAdjacentElement("afterend", card);
      else if (prevHand3 && prevHand3.parentNode)
        prevHand3.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const domain =
        String(
          data.domain || prog.domain || "einherit.cn"
        ).trim() || "einherit.cn";
      const pctRaw =
        prog.pct != null
          ? prog.pct
          : prog.percent != null
            ? prog.percent
            : data.progress_pct;
      const pct =
        pctRaw == null
          ? "—"
          : String(pctRaw) + (String(pctRaw).endsWith("%") ? "" : "%");
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const combo = done + " · " + domain + " · " + pct;
      const line = "手册完成 · 域名 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-done-domain-progress-pct-copy-r245-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneDomainProgressPctCopyR245Btn">复制完成域名进度R245</button>`;
      const btn = $("#handDoneDomainProgressPctCopyR245Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成域名进度R245" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度完成域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+中文品牌+英文品牌+版本四元复制（再进位） + round 层含 242 */
  async function paintDomainBrandBrandEnVersionR245CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDomainBrandBrandEnVersionR245CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDomainBrandBrandEnVersionR245CopyCard";
      card.className = "card settings-domain-brand-brand-en-version-r245-copy-card";
      const prevSet = $("#settingsBrandEnVersionOkDomainR244CopyCard");
      const prevSet2 = $("#settingsVersionOkDomainBrandR243CopyCard");
      const prevSet3 = $("#settingsOkDomainBrandEnVersionR242CopyCard");
      const roundList = $("#roundLayerListCard");
      if (prevSet && prevSet.parentNode)
        prevSet.insertAdjacentElement("beforebegin", card);
      else if (prevSet2 && prevSet2.parentNode)
        prevSet2.insertAdjacentElement("beforebegin", card);
      else if (prevSet3 && prevSet3.parentNode)
        prevSet3.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const brandEn = String(h.brand_en || h.brandEn || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const line = domain + " · " + brand + " · " + brandEn + " · " + ver;
      card.innerHTML = `<h3>域名 · 中文 · 英文 · 版本</h3>
        <p class="muted">一键复制域名、中文品牌、英文品牌与版本（演示级）。</p>
        <p class="settings-domain-brand-brand-en-version-r245-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsDomainBrandBrandEnVersionR245CopyBtn">复制域名中文英文版本R245</button>`;
      const btn = $("#settingsDomainBrandBrandEnVersionR245CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名中文英文版本R245" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 中文 · 英文 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList245() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 210;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 242); i++) expected.push(i);
    const loaded = expected.filter((n) => uniq.indexOf(n) >= 0);
    const missing = expected.filter((n) => uniq.indexOf(n) < 0);
    card.innerHTML = `<h3>版本与体验层</h3>
      <p class="muted">演示诊断：已加载的 round 增量脚本（只读）。</p>
      <p class="round-layer-summary"><strong>已加载</strong> round${
        loaded.length ? loaded[0] : "—"
      }…round${loaded.length ? loaded[loaded.length - 1] : "—"}
        · 共 ${loaded.length} 层</p>
      <div class="round-layer-chips" role="list">${loaded
        .map(
          (n) =>
            `<span class="tag round-layer-chip" role="listitem">round${n}</span>`
        )
        .join("")}</div>
      ${
        missing.length
          ? `<p class="muted" style="margin-top:8px">未检测到：${missing
              .map((n) => "round" + n)
              .join("、")}</p>`
          : `<p class="muted" style="margin-top:8px">round6…round245 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainBrandEnBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDispositionDeviceOwnerTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetVisibilityTagSummaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinStatusLastAgoNextSuggestedPlainR245Copy().catch(
          () => {}
        ),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelThresholdDepositedBalancePlainR245Copy().catch(
          () => {}
        ),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareHospitalCityDepartmentCopyButtonsR245().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteReadyDurationHintCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRelationContactCopyButtonsR245().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneDomainProgressPctCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainBrandEnBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDispositionDeviceOwnerTitleCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetVisibilityTagSummaryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinStatusLastAgoNextSuggestedPlainR245Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdDepositedBalancePlainR245Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalCityDepartmentCopyButtonsR245().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteReadyDurationHintCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRelationContactCopyButtonsR245().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneDomainProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainBrandBrandEnVersionR245CopyCard().catch(() => {});
        paintRoundLayerList245();
      }, 890);
      setTimeout(() => {
        paintDomainBrandBrandEnVersionR245CopyCard().catch(() => {});
        paintRoundLayerList245();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeDomainBrandEnBrand().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDispositionDeviceOwnerTitleCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetVisibilityTagSummaryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusLastAgoNextSuggestedPlainR245Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdDepositedBalancePlainR245Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalCityDepartmentCopyButtonsR245().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteReadyDurationHintCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRelationContactCopyButtonsR245().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneDomainProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainBrandBrandEnVersionR245CopyCard().catch(() => {});
      paintRoundLayerList245();
    }, 910);
  }
})();
