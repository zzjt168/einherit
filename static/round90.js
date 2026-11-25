/* 电子继承 · 第九十批增量（叠在 round89…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round90SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页应用名版本冷静条 */
  async function paintHomeAppVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAppVersionCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAppVersionCalmBar";
      bar.className = "home-app-version-calm-bar";
      bar.setAttribute("role", "status");
      const domainEn = $("#homeDomainBrandEnBar");
      const brandOk = $("#homeBrandEnOkBar");
      const appName = $("#homeAppNameCalmBar");
      if (domainEn && domainEn.parentNode === home)
        domainEn.insertAdjacentElement("afterend", bar);
      else if (brandOk && brandOk.parentNode === home)
        brandOk.insertAdjacentElement("afterend", bar);
      else if (appName && appName.parentNode === home)
        appName.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const sub = app + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-version-calm-mark">版本</span>
        <span class="muted home-app-version-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeAppVersionCalmGo">去设置</button>`;
      const btn = $("#homeAppVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-version-calm-mark">版本</span>
        <span class="muted home-app-version-calm-sub">应用版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeAppVersionCalmGo">去设置</button>`;
      const btn = $("#homeAppVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置+受益人+部门组合复制 */
  async function ensureLegacyActionBeneficiaryDeptCopyButtons() {
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
      const action = String(it.action || "").trim() || "未填处置";
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = action + " · " + ben + " · " + dept;
      el.dataset.actionBeneficiaryDept = line;
      if (el.querySelector(".lg-copy-action-beneficiary-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-action-beneficiary-dept";
      btn.textContent = "复制处置受益人部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.actionBeneficiaryDept || "");
        softBanner(ok ? "已复制处置受益人部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+提示+标签组合复制 */
  async function ensureAssetSummaryHintTagCopyButtons() {
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
      const summary = String(it.summary || "").trim() || "无摘要";
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const tag = String(it.tag || "").trim() || "未填标签";
      const line = summary + " · " + hint + " · " + tag;
      el.dataset.summaryHintTag = line;
      if (el.querySelector(".as-copy-summary-hint-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-hint-tag";
      btn.textContent = "复制摘要提示标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryHintTag || "");
        softBanner(ok ? "已复制摘要提示标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制即将到期文案 */
  async function ensureCheckinDueSoonPlainR90Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinDueSoonPlainR90CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinDueSoonPlainR90CopyCard";
      card.className = "checkin-due-soon-plain-r90-copy";
      const grace = $("#checkinGraceHoursPlainR89CopyCard");
      const interval = $("#checkinIntervalHoursPlainR88CopyCard");
      const secs = $("#checkinSecondsRemainingPlainR87CopyCard");
      if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else if (secs && secs.parentNode)
        secs.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const due = truthyFlag((st.countdown || {}).due_soon);
      const plain = due ? "即将到期" : "未临近到期";
      const line =
        "报备到期 · " + plain + "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-due-soon-plain-r90-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinDueSoonPlainR90CopyBtn">复制即将到期文案</button>`;
      const btn = $("#checkinDueSoonPlainR90CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(plain);
          softBanner(ok ? "已复制即将到期文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">即将到期文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标与进度百分比组合复制 */
  async function ensureTravelMetProgressPctPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetProgressPctPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetProgressPctPlainCopyCard";
      card.className = "travel-met-progress-pct-plain-copy";
      const thrBal = $("#travelThresholdBalancePlainCopyCard");
      const metBal = $("#travelMetBalancePlainCopyCard");
      const balShort = $("#travelBalanceShortfallPlainCopyCard");
      if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else if (metBal && metBal.parentNode)
        metBal.insertAdjacentElement("afterend", card);
      else if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const met = truthyFlag(fund.met) ? "达标" : "未达标";
      let pct = fund.progress_pct;
      if (pct == null && fund.progress != null) pct = fund.progress;
      const pctStr =
        pct == null || pct === ""
          ? "—"
          : String(Math.round(Number(pct))) + "%";
      const combo = met + " · " + pctStr;
      const line = "差旅达标 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-progress-pct-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetProgressPctPlainCopyBtn">复制达标进度百分比</button>`;
      const btn = $("#travelMetProgressPctPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标进度百分比" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标进度百分比暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+状态+预算组合复制 */
  async function ensureAftercareIdStatusBudgetCopyButtons() {
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
      if (!it || it.id == null) return;
      const status = String(it.status || "").trim() || "未填状态";
      const budget =
        it.travel_budget == null
          ? "—"
          : String(Math.round(Number(it.travel_budget)));
      const line = "#" + it.id + " · " + status + " · " + budget;
      el.dataset.idStatusBudget = line;
      if (el.querySelector(".ac-copy-id-status-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-status-budget";
      btn.textContent = "复制编号状态预算";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idStatusBudget || "");
        softBanner(ok ? "已复制编号状态预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频清单条数与完成文案组合复制 */
  async function ensureAuthChecklistCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avChecklistCompleteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avChecklistCompleteCopyCard";
      card.className = "av-checklist-complete-copy";
      const script = $("#avScriptCountCompleteCopyCard");
      const checklist = $("#avChecklistReadyCopyCard");
      const active = $("#avActiveIdReadyCopyCard");
      if (script && script.parentNode)
        script.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const count = list.length;
      const label =
        String(data.complete_label || "").trim() ||
        (truthyFlag(data.complete) ? "已完成" : "未完成");
      const combo = "清单 " + count + " · " + label;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-checklist-complete-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avChecklistCompleteCopyBtn">复制清单与完成</button>`;
      const btn = $("#avChecklistCompleteCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制清单与完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">清单与完成文案暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系+关系+角色组合复制 */
  async function ensureHeirContactRelationRoleCopyButtons() {
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
      if (!it) return;
      const contact = String(it.contact || "").trim() || "未填联系";
      const relation = String(it.relation || "").trim() || "未填关系";
      const role = String(it.role || "").trim() || "未填角色";
      const line = contact + " · " + relation + " · " + role;
      if (el.querySelector(".bn-copy-contact-relation-role")) return;
      el.dataset.contactRelationRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-relation-role";
      btn.textContent = "复制联系关系角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactRelationRole || "");
        softBanner(ok ? "已复制联系关系角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册生成时间与品牌组合复制 */
  async function ensureHandoverGeneratedAtBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handGeneratedAtBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handGeneratedAtBrandCopyCard";
      card.className = "hand-generated-at-brand-copy";
      const todoDom = $("#handTodoCountDomainCopyCard");
      const itemShare = $("#handItemCountShareHintCopyCard");
      const exportShare = $("#handExportPathShareHintCopyCard");
      if (todoDom && todoDom.parentNode)
        todoDom.insertAdjacentElement("afterend", card);
      else if (itemShare && itemShare.parentNode)
        itemShare.insertAdjacentElement("afterend", card);
      else if (exportShare && exportShare.parentNode)
        exportShare.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const raw = data.generated_at;
      let when = "—";
      if (raw != null && raw !== "") {
        const n = Number(raw);
        if (!isNaN(n) && n > 0) {
          const d = new Date(n > 1e12 ? n : n * 1000);
          when = isNaN(d.getTime())
            ? String(raw)
            : d.toISOString().slice(0, 19).replace("T", " ");
        } else {
          when = String(raw);
        }
      }
      const brand = String(data.brand || "").trim() || "电子继承";
      const combo = when + " · " + brand;
      const line = "手册生成 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-generated-at-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handGeneratedAtBrandCopyBtn">复制生成时间品牌</button>`;
      const btn = $("#handGeneratedAtBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制生成时间品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生成时间与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+版本+就绪组合复制 + round 层含 90 */
  async function paintDomainVersionOkR90CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#domainVersionOkR90CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "domainVersionOkR90CopyCard";
      card.className = "card domain-version-ok-r90-copy-card";
      const verOk = $("#versionOkBrandEnR89CopyCard");
      const domainOk = $("#domainOkBrandEnR88CopyCard");
      const appVer = $("#appVersionBrandEnR87CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (domainOk && domainOk.parentNode)
        domainOk.insertAdjacentElement("beforebegin", card);
      else if (appVer && appVer.parentNode)
        appVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = domain + " · " + ver + " · ok·" + okPart;
      card.innerHTML = `<h3>域名 · 版本 · 就绪</h3>
        <p class="muted">一键复制域名、版本与就绪状态（演示级）。</p>
        <p class="domain-version-ok-r90-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="domainVersionOkR90CopyBtn">复制域名版本就绪</button>`;
      const btn = $("#domainVersionOkR90CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名版本就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 版本 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList90() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 90;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 90); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round90 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAppVersion().catch(() => {}), 730);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyActionBeneficiaryDeptCopyButtons().catch(() => {}),
      560
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryHintTagCopyButtons().catch(() => {}),
      560
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinDueSoonPlainR90Copy().catch(() => {}),
      550
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelMetProgressPctPlainCopy().catch(() => {}),
      570
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdStatusBudgetCopyButtons().catch(() => {}),
      560
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthChecklistCompleteCopy().catch(() => {}), 530);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactRelationRoleCopyButtons().catch(() => {}),
      560
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverGeneratedAtBrandCopy().catch(() => {}),
      570
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAppVersion().catch(() => {}), 730);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyActionBeneficiaryDeptCopyButtons().catch(() => {}),
        580
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryHintTagCopyButtons().catch(() => {}),
        570
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinDueSoonPlainR90Copy().catch(() => {}),
        570
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelMetProgressPctPlainCopy().catch(() => {}),
        590
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdStatusBudgetCopyButtons().catch(() => {}),
        580
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthChecklistCompleteCopy().catch(() => {}),
        550
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactRelationRoleCopyButtons().catch(() => {}),
        570
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverGeneratedAtBrandCopy().catch(() => {}),
        580
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainVersionOkR90CopyCard().catch(() => {});
        paintRoundLayerList90();
      }, 620);
      setTimeout(() => {
        paintDomainVersionOkR90CopyCard().catch(() => {});
        paintRoundLayerList90();
      }, 1300);
    }
  };

  setTimeout(() => paintHomeAppVersion().catch(() => {}), 780);
  setTimeout(
    () => ensureLegacyActionBeneficiaryDeptCopyButtons().catch(() => {}),
    800
  );
  setTimeout(
    () => ensureAssetSummaryHintTagCopyButtons().catch(() => {}),
    820
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinDueSoonPlainR90Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetProgressPctPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdStatusBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthChecklistCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactRelationRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverGeneratedAtBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainVersionOkR90CopyCard().catch(() => {});
      paintRoundLayerList90();
    }, 640);
  }
})();
