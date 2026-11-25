/* 电子继承 · 第一百七十四批增量（叠在 round173…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round174SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+版本+中文品牌冷静条 */
  async function paintHomeBrandEnVersionBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnVersionBrandCalmBarR174");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnVersionBrandCalmBarR174";
      bar.className = "home-brand-en-version-brand-calm-r174";
      bar.setAttribute("role", "status");
      const domVer = $("#homeDomainVersionBrandCalmBarR173");
      const brandEn = $("#homeBrandBrandEnDomainCalmBarR172");
      const verEn = $("#homeVersionBrandEnDomainCalmBarR171");
      if (domVer && domVer.parentNode === home)
        domVer.insertAdjacentElement("afterend", bar);
      else if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (verEn && verEn.parentNode === home)
        verEn.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = en + " · " + ver + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-brand-calm-r174-mark">品牌</span>
        <span class="muted home-brand-en-version-brand-calm-r174-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionBrandCalmGoR174">去设置</button>`;
      const btn = $("#homeBrandEnVersionBrandCalmGoR174");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-brand-calm-r174-mark">品牌</span>
        <span class="muted home-brand-en-version-brand-calm-r174-sub">英文版本品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionBrandCalmGoR174">去设置</button>`;
      const btn = $("#homeBrandEnVersionBrandCalmGoR174");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+处置意向+受益人组合复制（进位） */
  async function ensureLegacyTitleDispositionBeneficiaryCopyButtons() {
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
        String(it.disposition || it.action || "").trim() || "未填处置";
      const beneficiary =
        String(it.beneficiary || it.heir || "").trim() || "未填受益人";
      const line = title + " · " + disposition + " · " + beneficiary;
      el.dataset.titleDispositionBeneficiaryR174 = line;
      if (el.querySelector(".lg-copy-title-disposition-beneficiary-r174"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm lg-copy-title-disposition-beneficiary-r174";
      btn.textContent = "复制标题处置受益人";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.titleDispositionBeneficiaryR174 || ""
        );
        softBanner(ok ? "已复制标题处置受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+标签+可见性组合复制（进位） */
  async function ensureAssetSummaryTagVisibilityCopyButtons() {
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
      const tag = String(it.tag || it.label || "").trim() || "未填标签";
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const line = summary + " · " + tag + " · " + visibility;
      el.dataset.summaryTagVisibilityR174 = line;
      if (el.querySelector(".as-copy-summary-tag-visibility-r174")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-tag-visibility-r174";
      btn.textContent = "复制摘要标签可见性";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryTagVisibilityR174 || "");
        softBanner(ok ? "已复制摘要标签可见性" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+下次建议时间（进位） */
  async function ensureCheckinWindowEndsNextSuggestedPlainR174Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsNextSuggestedPlainR174CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsNextSuggestedPlainR174CopyCard";
      card.className = "checkin-window-ends-next-suggested-plain-r174-copy";
      const nextStatus = $("#checkinNextSuggestedAtStatusLabelPlainR173CopyCard");
      const statusLast = $("#checkinStatusLabelLastAgoPlainR172CopyCard");
      const lastWin = $("#checkinLastAgoWindowEndsPlainR171CopyCard");
      if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
      else if (statusLast && statusLast.parentNode)
        statusLast.insertAdjacentElement("afterend", card);
      else if (lastWin && lastWin.parentNode)
        lastWin.insertAdjacentElement("afterend", card);
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
      const windowEnds =
        String(
          st.window_ends_at ||
            cd.window_ends_at ||
            user.window_ends_at ||
            cd.window_end ||
            ""
        ).trim() || "暂无窗口截止";
      const nextAt =
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const combo = windowEnds + " · " + nextAt;
      const line =
        "报备窗口截止 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-next-suggested-plain-r174-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsNextSuggestedPlainR174CopyBtn">复制窗口截止下次建议</button>`;
      const btn = $("#checkinWindowEndsNextSuggestedPlainR174CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口截止下次建议" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口截止下次建议文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+已存+短差三元复制（进位） */
  async function ensureTravelBalanceDepositedShortfallPlainR174Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceDepositedShortfallPlainR174CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceDepositedShortfallPlainR174CopyCard";
      card.className = "travel-balance-deposited-shortfall-plain-r174-copy";
      const depShort = $("#travelDepositedShortfallThresholdPlainR173CopyCard");
      const shortThr = $("#travelShortfallThresholdBalancePlainR172CopyCard");
      const thrBal = $("#travelThresholdBalanceDepositedPlainR171CopyCard");
      if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
      else if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
      else if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const deposited =
        fund.deposited == null
          ? fund.balance == null
            ? "—"
            : String(Math.round(Number(fund.balance)))
          : String(Math.round(Number(fund.deposited)));
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = balance + " · " + deposited + " · " + shortfall;
      const line =
        "差旅余额 · 已存 · 短差 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-deposited-shortfall-plain-r174-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceDepositedShortfallPlainR174CopyBtn">复制余额已存短差R174</button>`;
      const btn = $("#travelBalanceDepositedShortfallPlainR174CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额已存短差R174" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额已存短差文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+服务类型+科室组合复制（进位） */
  async function ensureAftercareHospitalServiceTypeDepartmentCopyButtonsR174() {
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
      const serviceType =
        String(it.service_type || it.service || "").trim() || "未填服务类型";
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const line = hospital + " · " + serviceType + " · " + department;
      el.dataset.hospitalServiceTypeDepartmentR174 = line;
      if (el.querySelector(".ac-copy-hospital-service-type-department-r174"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-hospital-service-type-department-r174";
      btn.textContent = "复制医院服务科室R174";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.hospitalServiceTypeDepartmentR174 || ""
        );
        softBanner(ok ? "已复制医院服务科室R174" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+就绪+完成态组合复制（进位） */
  async function ensureAuthDurationHintReadyCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintReadyCompleteCopyR174Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintReadyCompleteCopyR174Card";
      card.className = "av-duration-hint-ready-complete-copy-r174";
      const readyComplete = $("#avReadyCompleteMissingCopyR173Card");
      const completeMiss = $("#avCompleteMissingDurationHintCopyR172Card");
      const missDur = $("#avMissingDurationHintReadyCopyR171Card");
      if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else if (missDur && missDur.parentNode)
        missDur.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
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
            : data.ready
      )
        ? "已完成"
        : "未完成";
      const combo = duration + " · " + ready + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-ready-complete-copy-r174-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintReadyCompleteCopyR174Btn">复制时长就绪完成</button>`;
      const btn = $("#avDurationHintReadyCompleteCopyR174Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长就绪完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长就绪完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+编号+联系方式组合复制（进位） */
  async function ensureHeirRelationIdContactCopyButtonsR174() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const idLabel = String(it.id);
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const line = relation + " · " + idLabel + " · " + contact;
      if (el.querySelector(".bn-copy-relation-id-contact-r174")) return;
      el.dataset.relationIdContactR174 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-id-contact-r174";
      btn.textContent = "复制关系编号联系R174";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationIdContactR174 || "");
        softBanner(ok ? "已复制关系编号联系R174" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+域名+章节数组合复制 */
  async function ensureHandoverDoneDomainSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneDomainSectionsCopyR174Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneDomainSectionsCopyR174Card";
      card.className = "hand-done-domain-sections-copy-r174";
      const domSec = $("#handDomainSectionsProgressPctCopyR173Card");
      const secPct = $("#handSectionsProgressPctDoneCopyR172Card");
      const pctDone = $("#handProgressPctDoneDomainCopyR171Card");
      if (domSec && domSec.parentNode)
        domSec.insertAdjacentElement("afterend", card);
      else if (secPct && secPct.parentNode)
        secPct.insertAdjacentElement("afterend", card);
      else if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      let domain = "einherit.cn";
      try {
        const h = await api("/api/health");
        domain = String(h.domain || data.domain || "einherit.cn").trim();
      } catch (_) {
        domain = String(data.domain || "einherit.cn").trim();
      }
      const sections =
        data.sections != null
          ? String(data.sections)
          : prog.sections != null
            ? String(prog.sections)
            : prog.total_types != null
              ? String(prog.total_types)
              : data.total != null
                ? String(data.total)
                : "—";
      const combo = done + " · " + domain + " · " + sections;
      const line = "手册完成 · 域名 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-done-domain-sections-copy-r174-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneDomainSectionsCopyR174Btn">复制完成域名章节</button>`;
      const btn = $("#handDoneDomainSectionsCopyR174Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成域名章节" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成域名章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+ok+版本+英文品牌四元复制 + round 层含 174 */
  async function paintDomainOkVersionBrandEnR174CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDomainOkVersionBrandEnR174CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDomainOkVersionBrandEnR174CopyCard";
      card.className = "card settings-domain-ok-version-brand-en-r174-copy-card";
      const okVer = $("#settingsOkVersionBrandEnBrandR173CopyCard");
      const verEn = $("#settingsVersionBrandEnBrandOkR172CopyCard");
      const brandEn = $("#settingsBrandEnBrandOkDomainR171CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (verEn && verEn.parentNode)
        verEn.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = domain + " · " + okLabel + " · " + ver + " · " + en;
      card.innerHTML = `<h3>域名 · 就绪 · 版本 · 英文</h3>
        <p class="muted">一键复制域名、就绪态、版本与英文品牌（演示级）。</p>
        <p class="settings-domain-ok-version-brand-en-r174-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsDomainOkVersionBrandEnR174CopyBtn">复制域名就绪版本英文</button>`;
      const btn = $("#settingsDomainOkVersionBrandEnR174CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名就绪版本英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 就绪 · 版本 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList174() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 174;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 174); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round174 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnVersionBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyTitleDispositionBeneficiaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryTagVisibilityCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinWindowEndsNextSuggestedPlainR174Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelBalanceDepositedShortfallPlainR174Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareHospitalServiceTypeDepartmentCopyButtonsR174().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintReadyCompleteCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationIdContactCopyButtonsR174().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneDomainSectionsCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnVersionBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyTitleDispositionBeneficiaryCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryTagVisibilityCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinWindowEndsNextSuggestedPlainR174Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceDepositedShortfallPlainR174Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalServiceTypeDepartmentCopyButtonsR174().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintReadyCompleteCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationIdContactCopyButtonsR174().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneDomainSectionsCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainOkVersionBrandEnR174CopyCard().catch(() => {});
        paintRoundLayerList174();
      }, 890);
      setTimeout(() => {
        paintDomainOkVersionBrandEnR174CopyCard().catch(() => {});
        paintRoundLayerList174();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandEnVersionBrand().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyTitleDispositionBeneficiaryCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetSummaryTagVisibilityCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsNextSuggestedPlainR174Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceDepositedShortfallPlainR174Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalServiceTypeDepartmentCopyButtonsR174().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintReadyCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationIdContactCopyButtonsR174().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneDomainSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainOkVersionBrandEnR174CopyCard().catch(() => {});
      paintRoundLayerList174();
    }, 910);
  }
})();
