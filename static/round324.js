/* 电子继承 · 第三百二十四批增量（叠在 round324…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round324SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+域名+版本冷静条 */
  async function paintHomeBrandDomainVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandDomainVersionCalmBarR324");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandDomainVersionCalmBarR324";
      bar.className = "home-brand-domain-version-calm-r324";
      bar.setAttribute("role", "status");
      const prev = $("#homeBrandDomainVersionCalmBarR323");
      const prev2 = $("#homeBrandDomainVersionCalmBarR322");
      const prev3 = $("#homeBrandDomainVersionCalmBarR321");
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
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || h.host || "einherit.cn").trim() || "einherit.cn";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = brand + " · " + domain + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-domain-version-calm-r324-mark">品牌</span>
        <span class="muted home-brand-domain-version-calm-r324-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandDomainVersionCalmGoR324">去设置</button>`;
      const btn = $("#homeBrandDomainVersionCalmGoR324");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-domain-version-calm-r324-mark">品牌</span>
        <span class="muted home-brand-domain-version-calm-r324-sub">中文品牌域名版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandDomainVersionCalmGoR324">去设置</button>`;
      const btn = $("#homeBrandDomainVersionCalmGoR324");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置+设备归属+标题组合复制（三百二十四进位） */
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
      const deviceOwner =
        String(it.device_owner || it.owner || it.belong_to || "").trim() ||
        "未填归属";
      const disposition =
        String(it.disposition || it.action || it.intent || "").trim() ||
        "未填处置";
      const title = String(it.title || "").trim() || "无标题";
      const line = disposition + " · " + deviceOwner + " · " + title;
      el.dataset.dispositionDeviceOwnerTitleR324 = line;
      if (el.querySelector(".lg-copy-disposition-device-owner-title-r324")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-disposition-device-owner-title-r324";
      btn.textContent = "复制处置归属标题R324";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.dispositionDeviceOwnerTitleR324 || "");
        softBanner(ok ? "已复制处置归属标题R324" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+可见性+标签组合复制（三百二十四进位） */
  async function ensureAssetSummaryVisibilityTagCopyButtons() {
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
      const line = summary + " · " + visibility + " · " + tag;
      el.dataset.summaryVisibilityTagR324 = line;
      if (el.querySelector(".as-copy-summary-visibility-tag-r324")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-visibility-tag-r324";
      btn.textContent = "复制摘要可见性标签R324";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.summaryVisibilityTagR324 || ""
        );
        softBanner(ok ? "已复制摘要可见性标签R324" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+状态+上次距今（三百二十四进位） */
  async function ensureCheckinNextSuggestedStatusLastAgoPlainR324Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedStatusLastAgoPlainR324CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedStatusLastAgoPlainR324CopyCard";
      card.className =
        "checkin-next-suggested-status-last-ago-plain-r324-copy";
      const prevCk = $(
        "#checkinNextSuggestedStatusLastAgoPlainR323CopyCard"
      );
      const prevCk2 = $(
        "#checkinNextSuggestedStatusLastAgoPlainR322CopyCard"
      );
      const prevCk3 = $(
        "#checkinNextSuggestedStatusLastAgoPlainR321CopyCard"
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
      const combo = nextAt + " · " + status + " · " + lastAgo;
      const line =
        "报备下次建议 · 状态 · 上次距今 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-status-last-ago-plain-r324-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedStatusLastAgoPlainR324CopyBtn">复制下次建议状态上次距今R324</button>`;
      const btn = $("#checkinNextSuggestedStatusLastAgoPlainR324CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次建议状态上次距今R324" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次建议状态上次距今文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+门槛+已存三元复制（三百二十四进位） */
  async function ensureTravelBalanceThresholdDepositedPlainR324Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceThresholdDepositedPlainR324CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceThresholdDepositedPlainR324CopyCard";
      card.className = "travel-balance-threshold-deposited-plain-r324-copy";
      const prevTr = $(
        "#travelBalanceThresholdDepositedPlainR323CopyCard"
      );
      const prevTr2 = $(
        "#travelBalanceThresholdDepositedPlainR322CopyCard"
      );
      const prevTr3 = $(
        "#travelBalanceThresholdDepositedPlainR321CopyCard"
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
      const combo = balance + " · " + threshold + " · " + deposited;
      const line =
        "差旅余额 · 门槛 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-threshold-deposited-plain-r324-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceThresholdDepositedPlainR324CopyBtn">复制余额门槛已存R324</button>`;
      const btn = $("#travelBalanceThresholdDepositedPlainR324CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额门槛已存R324" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额门槛已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅城市+医院+科室组合复制（三百二十四进位） */
  async function ensureAftercareCityHospitalDepartmentCopyButtonsR324() {
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
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const city = String(it.city || "").trim() || "未填城市";
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const line = city + " · " + hospital + " · " + department;
      el.dataset.cityHospitalDepartmentR324 = line;
      if (el.querySelector(".ac-copy-city-hospital-department-r324"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-city-hospital-department-r324";
      btn.textContent = "复制城市医院科室R324";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.cityHospitalDepartmentR324 || ""
        );
        softBanner(ok ? "已复制城市医院科室R324" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+时长提示+完成组合复制（三百二十四进位） */
  async function ensureAuthReadyDurationHintCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyDurationHintCompleteCopyR324Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyDurationHintCompleteCopyR324Card";
      card.className = "av-ready-duration-hint-complete-copy-r324";
      const prevAv = $("#avReadyDurationHintCompleteCopyR323Card");
      const prevAv2 = $("#avReadyDurationHintCompleteCopyR322Card");
      const prevAv3 = $("#avReadyDurationHintCompleteCopyR321Card");
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
      const combo = ready + " · " + duration + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-duration-hint-complete-copy-r324-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyDurationHintCompleteCopyR324Btn">复制就绪时长完成R324</button>`;
      const btn = $("#avReadyDurationHintCompleteCopyR324Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪时长完成R324" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪时长完成文案暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+联系方式+姓名组合复制（三百二十四进位） */
  async function ensureHeirRelationContactNameCopyButtonsR324() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const relation =
        String(it.relation || it.role || "").trim() || "未填关系";
      const line = relation + " · " + contact + " · " + name;
      if (el.querySelector(".bn-copy-relation-contact-name-r324")) return;
      el.dataset.relationContactNameR324 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-contact-name-r324";
      btn.textContent = "复制关系联系姓名R324";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationContactNameR324 || "");
        softBanner(ok ? "已复制关系联系姓名R324" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+进度百分比+完成数组合复制（三百二十四进位） */
  async function ensureHandoverDomainProgressPctDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainProgressPctDoneCopyR324Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainProgressPctDoneCopyR324Card";
      card.className = "hand-domain-progress-pct-done-copy-r324";
      const prevHand = $("#handDomainProgressPctDoneCopyR323Card");
      const prevHand2 = $("#handDomainProgressPctDoneCopyR322Card");
      const prevHand3 = $("#handDomainProgressPctDoneCopyR321Card");
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
      const combo = domain + " · " + pct + " · " + done;
      const line = "手册域名 · 进度 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-progress-pct-done-copy-r324-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainProgressPctDoneCopyR324Btn">复制域名进度完成数R324</button>`;
      const btn = $("#handDomainProgressPctDoneCopyR324Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名进度完成数R324" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成进度域名文案暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+英文品牌+版本+中文品牌四元复制（再进位） + round 层含 300 */
  async function paintOkBrandEnVersionBrandR324CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkBrandEnVersionBrandR324CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkBrandEnVersionBrandR324CopyCard";
      card.className = "card settings-ok-brand-en-version-brand-r324-copy-card";
      const prevSet = $("#settingsOkBrandEnVersionBrandR323CopyCard");
      const prevSet2 = $("#settingsOkBrandEnVersionBrandR322CopyCard");
      const prevSet3 = $("#settingsOkBrandEnVersionBrandR321CopyCard");
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
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const ver = String(h.version || h.server_version || "—").trim();
      const brandEn = String(h.brand_en || h.brandEn || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = okLabel + " · " + brandEn + " · " + ver + " · " + brand;
      card.innerHTML = `<h3>就绪 · 英文 · 版本 · 中文</h3>
        <p class="muted">一键复制就绪态、英文品牌、版本与中文品牌（演示级）。</p>
        <p class="settings-ok-brand-en-version-brand-r324-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkBrandEnVersionBrandR324CopyBtn">复制就绪英文版本中文R324</button>`;
      const btn = $("#settingsOkBrandEnVersionBrandR324CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪英文版本中文R324" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 英文 · 版本 · 中文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList324() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 210;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 324); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round324 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandDomainVersion().catch(() => {}), 1000);
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
        ensureAssetSummaryVisibilityTagCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinNextSuggestedStatusLastAgoPlainR324Copy().catch(
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
        ensureTravelBalanceThresholdDepositedPlainR324Copy().catch(
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
        ensureAftercareCityHospitalDepartmentCopyButtonsR324().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyDurationHintCompleteCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationContactNameCopyButtonsR324().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainProgressPctDoneCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandDomainVersion().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDispositionDeviceOwnerTitleCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetSummaryVisibilityTagCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinNextSuggestedStatusLastAgoPlainR324Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceThresholdDepositedPlainR324Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareCityHospitalDepartmentCopyButtonsR324().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyDurationHintCompleteCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationContactNameCopyButtonsR324().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainProgressPctDoneCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkBrandEnVersionBrandR324CopyCard().catch(() => {});
        paintRoundLayerList324();
      }, 890);
      setTimeout(() => {
        paintOkBrandEnVersionBrandR324CopyCard().catch(() => {});
        paintRoundLayerList324();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandDomainVersion().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDispositionDeviceOwnerTitleCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetSummaryVisibilityTagCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedStatusLastAgoPlainR324Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceThresholdDepositedPlainR324Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityHospitalDepartmentCopyButtonsR324().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyDurationHintCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationContactNameCopyButtonsR324().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainProgressPctDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkBrandEnVersionBrandR324CopyCard().catch(() => {});
      paintRoundLayerList324();
    }, 910);
  }
})();