/* 电子继承 · 第二百零七批增量（叠在 round190…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round207SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+中文品牌+版本冷静条 */
  async function paintHomeBrandEnBrandVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnBrandVersionCalmBarR207");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnBrandVersionCalmBarR207";
      bar.className = "home-brand-en-brand-version-calm-r207";
      bar.setAttribute("role", "status");
      const prev = $("#homeDomainBrandEnVersionCalmBarR206");
      const prev2 = $("#homeVersionBrandDomainCalmBarR205");
      const prev3 = $("#homeBrandEnVersionBrandCalmBarR204");
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
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const version = String(h.version || h.server_version || "").trim() || "未标版本";
      const sub = en + " · " + brand + " · " + version;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-brand-version-calm-r207-mark">英文</span>
        <span class="muted home-brand-en-brand-version-calm-r207-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnBrandVersionCalmGoR207">去设置</button>`;
      const btn = $("#homeBrandEnBrandVersionCalmGoR207");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-brand-version-calm-r207-mark">英文</span>
        <span class="muted home-brand-en-brand-version-calm-r207-sub">英文中文版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnBrandVersionCalmGoR207">去设置</button>`;
      const btn = $("#homeBrandEnBrandVersionCalmGoR207");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+设备归属+处置意向组合复制（七进位） */
  async function ensureLegacyTitleDeviceOwnerDispositionCopyButtons() {
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
      const deviceOwner =
        String(it.device_owner || it.owner || it.belong_to || "").trim() ||
        "未填归属";
      const disposition =
        String(it.disposition || it.action || it.intent || "").trim() ||
        "未填处置";
      const line = title + " · " + deviceOwner + " · " + disposition;
      el.dataset.titleDeviceOwnerDispositionR207 = line;
      if (el.querySelector(".lg-copy-title-device-owner-disposition-r207")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-device-owner-disposition-r207";
      btn.textContent = "复制标题归属处置R207";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleDeviceOwnerDispositionR207 || "");
        softBanner(ok ? "已复制标题归属处置R207" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+摘要+标签组合复制（七进位） */
  async function ensureAssetVisibilitySummaryTagCopyButtons() {
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
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const tag = String(it.tag || it.tags || it.label || "").trim() || "无标签";
      const line = visibility + " · " + summary + " · " + tag;
      el.dataset.visibilitySummaryTagR207 = line;
      if (el.querySelector(".as-copy-visibility-summary-tag-r207")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-summary-tag-r207";
      btn.textContent = "复制可见性摘要标签R207";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.visibilitySummaryTagR207 || ""
        );
        softBanner(ok ? "已复制可见性摘要标签R207" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+上次距今+状态（七进位） */
  async function ensureCheckinNextSuggestedLastAgoStatusPlainR207Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedLastAgoStatusPlainR207CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedLastAgoStatusPlainR207CopyCard";
      card.className =
        "checkin-next-suggested-last-ago-status-plain-r207-copy";
      const prevCk = $(
        "#checkinStatusLastAgoNextSuggestedPlainR206CopyCard"
      );
      const prevCk2 = $(
        "#checkinLastAgoNextSuggestedStatusPlainR205CopyCard"
      );
      const prevCk3 = $(
        "#checkinNextSuggestedStatusLastAgoPlainR204CopyCard"
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
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            st.last_ago ||
            cd.last_ago ||
            ""
        ).trim() || "暂无上次距今";
      const status =
        String(
          st.status ||
            cd.status ||
            user.status ||
            st.status_label ||
            cd.status_label ||
            ""
        ).trim() || "暂无状态";
      const combo = nextAt + " · " + lastAgo + " · " + status;
      const line =
        "报备下次建议 · 上次距今 · 状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-last-ago-status-plain-r207-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedLastAgoStatusPlainR207CopyBtn">复制下次距今状态R207</button>`;
      const btn = $("#checkinNextSuggestedLastAgoStatusPlainR207CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次距今状态R207" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次距今状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+门槛+余额三元复制（七进位） */
  async function ensureTravelDepositedThresholdBalancePlainR207Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedThresholdBalancePlainR207CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedThresholdBalancePlainR207CopyCard";
      card.className = "travel-deposited-threshold-balance-plain-r207-copy";
      const prevTr = $(
        "#travelThresholdDepositedBalancePlainR206CopyCard"
      );
      const prevTr2 = $(
        "#travelBalanceThresholdDepositedPlainR205CopyCard"
      );
      const prevTr3 = $(
        "#travelDepositedBalanceThresholdPlainR204CopyCard"
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
      const threshold =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const combo = deposited + " · " + threshold + " · " + balance;
      const line =
        "差旅已存 · 门槛 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-threshold-balance-plain-r207-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedThresholdBalancePlainR207CopyBtn">复制已存门槛余额R207</button>`;
      const btn = $("#travelDepositedThresholdBalancePlainR207CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存门槛余额R207" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存门槛余额文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅城市+医院+科室组合复制（七进位） */
  async function ensureAftercareCityHospitalDepartmentCopyButtonsR207() {
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
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const line = city + " · " + hospital + " · " + department;
      el.dataset.cityHospitalDepartmentR207 = line;
      if (el.querySelector(".ac-copy-city-hospital-department-r207"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-city-hospital-department-r207";
      btn.textContent = "复制城市医院科室R207";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.cityHospitalDepartmentR207 || ""
        );
        softBanner(ok ? "已复制城市医院科室R207" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+完成+时长提示组合复制（七进位） */
  async function ensureAuthReadyCompleteDurationHintCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteDurationHintCopyR207Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteDurationHintCopyR207Card";
      card.className = "av-ready-complete-duration-hint-copy-r207";
      const prevAv = $("#avCompleteReadyDurationHintCopyR206Card");
      const prevAv2 = $("#avDurationHintCompleteReadyCopyR205Card");
      const prevAv3 = $("#avReadyDurationHintCompleteCopyR204Card");
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
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const combo = ready + " · " + complete + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-complete-duration-hint-copy-r207-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteDurationHintCopyR207Btn">复制就绪完成时长R207</button>`;
      const btn = $("#avReadyCompleteDurationHintCopyR207Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪完成时长R207" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪完成时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+姓名+联系方式组合复制（七进位） */
  async function ensureHeirRelationNameContactCopyButtonsR207() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const line = relation + " · " + name + " · " + contact;
      if (el.querySelector(".bn-copy-relation-name-contact-r207")) return;
      el.dataset.relationNameContactR207 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-name-contact-r207";
      btn.textContent = "复制关系姓名联系R207";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationNameContactR207 || "");
        softBanner(ok ? "已复制关系姓名联系R207" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+完成数+进度百分比组合复制（七进位） */
  async function ensureHandoverDomainDoneProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainDoneProgressPctCopyR207Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainDoneProgressPctCopyR207Card";
      card.className = "hand-domain-done-progress-pct-copy-r207";
      const prevHand = $("#handDoneDomainProgressPctCopyR206Card");
      const prevHand2 = $("#handProgressPctDoneDomainCopyR205Card");
      const prevHand3 = $("#handDomainProgressPctDoneCopyR204Card");
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
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
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
      const combo = domain + " · " + done + " · " + pct;
      const line = "手册域名 · 完成 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-done-progress-pct-copy-r207-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainDoneProgressPctCopyR207Btn">复制域名完成进度R207</button>`;
      const btn = $("#handDomainDoneProgressPctCopyR207Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名完成进度R207" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名完成进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+中文品牌+英文品牌+就绪四元复制（再进位） + round 层含 207 */
  async function paintDomainBrandBrandEnOkR207CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDomainBrandBrandEnOkR207CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDomainBrandBrandEnOkR207CopyCard";
      card.className = "card settings-domain-brand-brand-en-ok-r207-copy-card";
      const prevSet = $("#settingsVersionDomainBrandBrandEnR206CopyCard");
      const prevSet2 = $("#settingsOkVersionDomainBrandR205CopyCard");
      const prevSet3 = $("#settingsBrandEnOkVersionDomainR204CopyCard");
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
      const en = String(h.brand_en || "E-Inherit").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const line = domain + " · " + brand + " · " + en + " · " + okLabel;
      card.innerHTML = `<h3>域名 · 中文 · 英文 · 就绪</h3>
        <p class="muted">一键复制域名、中英文品牌与就绪态（演示级）。</p>
        <p class="settings-domain-brand-brand-en-ok-r207-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsDomainBrandBrandEnOkR207CopyBtn">复制域名中英就绪R207</button>`;
      const btn = $("#settingsDomainBrandBrandEnOkR207CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名中英就绪R207" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 中文 · 英文 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList207() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 207;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 207); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round207 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnBrandVersion().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleDeviceOwnerDispositionCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetVisibilitySummaryTagCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinNextSuggestedLastAgoStatusPlainR207Copy().catch(
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
        ensureTravelDepositedThresholdBalancePlainR207Copy().catch(
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
        ensureAftercareCityHospitalDepartmentCopyButtonsR207().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyCompleteDurationHintCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationNameContactCopyButtonsR207().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainDoneProgressPctCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnBrandVersion().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyTitleDeviceOwnerDispositionCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetVisibilitySummaryTagCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinNextSuggestedLastAgoStatusPlainR207Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedThresholdBalancePlainR207Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareCityHospitalDepartmentCopyButtonsR207().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyCompleteDurationHintCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationNameContactCopyButtonsR207().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainDoneProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainBrandBrandEnOkR207CopyCard().catch(() => {});
        paintRoundLayerList207();
      }, 890);
      setTimeout(() => {
        paintDomainBrandBrandEnOkR207CopyCard().catch(() => {});
        paintRoundLayerList207();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandEnBrandVersion().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyTitleDeviceOwnerDispositionCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetVisibilitySummaryTagCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedLastAgoStatusPlainR207Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedThresholdBalancePlainR207Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityHospitalDepartmentCopyButtonsR207().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteDurationHintCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationNameContactCopyButtonsR207().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainDoneProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainBrandBrandEnOkR207CopyCard().catch(() => {});
      paintRoundLayerList207();
    }, 910);
  }
})();
