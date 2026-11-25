/* 电子继承 · 第三十三批增量（叠在 round32…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round33SoftBanner_" + (hostId || "home");
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

  function parseTs(raw) {
    if (raw == null || raw === "") return 0;
    if (typeof raw === "number") return raw > 1e12 ? raw / 1000 : raw;
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) return n > 1e12 ? n / 1000 : n;
    const d = Date.parse(String(raw));
    return Number.isNaN(d) ? 0 : d / 1000;
  }

  function formatDue(ts) {
    const t = parseTs(ts);
    if (!t) return "";
    if (typeof fmtTime === "function") return fmtTime(t);
    try {
      return new Date(t * 1000).toLocaleString();
    } catch (_) {
      return String(ts);
    }
  }

  /* 1 · 首页会员开通状态一句 */
  async function paintHomeMemberStatus() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeMemberStatusBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeMemberStatusBar";
      bar.className = "home-member-status-bar";
      bar.setAttribute("role", "status");
      const av = $("#homeAuthGateBar");
      const as = $("#homeAssetsCountBar");
      if (av && av.parentNode === home) av.insertAdjacentElement("afterend", bar);
      else if (as && as.parentNode === home) as.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/me");
      const user = data.user || data;
      const on = !!user.is_member;
      bar.hidden = false;
      if (on) {
        bar.innerHTML = `<span class="home-mb-mark">会员</span>
          <span class="muted home-mb-sub">已开通 · 守望与手册可按节奏用</span>
          <button type="button" class="btn ghost sm" id="homeMemberGo">去会员</button>`;
      } else {
        bar.innerHTML = `<span class="home-mb-mark">会员</span>
          <span class="muted home-mb-sub">尚未开通 · 可先了解权益</span>
          <button type="button" class="btn ghost sm" id="homeMemberGo">去会员</button>`;
      }
      const btn = $("#homeMemberGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("member");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割备注一键复制 */
  async function ensureLegacyNotesCopyButtons() {
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
      const notes = it ? String(it.notes || "").trim() : "";
      if (it) el.dataset.notes = notes;
      let btn = el.querySelector(".lg-copy-notes");
      if (!notes) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-notes";
      btn.textContent = "复制备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notes || "");
        softBanner(ok ? "已复制交割备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘当前可见条数回显 */
  function paintAssetsVisibleCount() {
    const list = $("#asList");
    if (!list || !list.parentNode) return;
    let bar = $("#asVisibleCountBar");
    if (!bar) {
      bar = document.createElement("p");
      bar.id = "asVisibleCountBar";
      bar.className = "muted as-visible-count";
      bar.setAttribute("role", "status");
      list.parentNode.insertBefore(bar, list);
    }
    const items = $$("#asList .item").filter((el) => el.querySelector("strong"));
    const visible = items.filter((el) => !el.hidden);
    bar.textContent = "当前可见 " + visible.length + " 条 · 只读";
  }

  function bindAssetsVisibleCountObserver() {
    const list = $("#asList");
    if (!list || list.dataset.r33vis) return;
    list.dataset.r33vis = "1";
    const mo = new MutationObserver(() => paintAssetsVisibleCount());
    mo.observe(list, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "class", "style"],
    });
    paintAssetsVisibleCount();
  }

  /* 4 · 报备页复制下次建议节点 */
  async function ensureCheckinDueCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinDueCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinDueCopyCard";
      card.className = "checkin-due-copy";
      const combo = $("#checkinComboCopyCard");
      const member = $("#checkinMemberCopyCard");
      if (combo && combo.parentNode) combo.insertAdjacentElement("afterend", card);
      else if (member && member.parentNode) member.insertAdjacentElement("afterend", card);
      else box.appendChild(card);
    }
    try {
      const st = await api("/api/checkin/status");
      const user = st.user || {};
      const due = user.checkin_due_at || user.next_checkin_at || "";
      const label = formatDue(due);
      const line = label
        ? "下次建议报备节点 · " + label + "（电子继承 · 只读演示）"
        : "下次建议节点暂不可用";
      card.innerHTML = `<p class="muted checkin-due-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="checkinDueCopyBtn" ${
          label ? "" : "disabled"
        }>复制下次建议节点</button>`;
      const btn = $("#checkinDueCopyBtn");
      if (btn && label) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制下次建议节点" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次建议节点暂不可用</p>`;
    }
  }

  /* 5 · 差旅复制建议门槛金额 */
  async function ensureTravelThresholdAmtCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdAmtCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdAmtCopyCard";
      card.className = "travel-threshold-amt-copy";
      const thr = $("#travelThresholdCopyCard");
      const bal = $("#travelBalanceCopyCard");
      if (thr && thr.parentNode) thr.insertAdjacentElement("afterend", card);
      else if (bal && bal.parentNode) bal.insertAdjacentElement("afterend", card);
      else box.insertBefore(card, box.firstChild);
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const thr = Number(fund.threshold != null ? fund.threshold : 2000);
      const line = "建议门槛 ¥" + thr + "（电子继承 · 差旅预存演示）";
      card.innerHTML = `<p class="muted travel-threshold-amt-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdAmtCopyBtn">复制门槛金额</button>`;
      const btn = $("#travelThresholdAmtCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制建议门槛金额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛金额暂不可用</p>`;
    }
  }

  /* 6 · 善后城市一键复制 */
  async function ensureAftercareCityCopyButtons() {
    const list = $("#acList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/aftercare");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    $$("#acList .item").forEach((el, i) => {
      const it = items[i];
      if (!it) return;
      if (it.id != null) el.dataset.id = String(it.id);
      const city = String(it.city || "").trim();
      el.dataset.city = city;
      let btn = el.querySelector(".ac-copy-city");
      if (!city) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city";
      btn.textContent = "复制城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.city || "");
        softBanner(ok ? "已复制工单城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频脚本段数只读 */
  async function paintAuthScriptSegCount() {
    const panel = $("#authvideo");
    if (!panel) return;
    let bar = $("#avScriptSegCount");
    if (!bar) {
      bar = document.createElement("p");
      bar.id = "avScriptSegCount";
      bar.className = "muted av-script-seg-count";
      bar.setAttribute("role", "status");
      const miss = $("#avMissingCopyCard");
      const charCount = $("#avScriptCharCount");
      const script = $("#authScript");
      if (miss && miss.parentNode) miss.insertAdjacentElement("afterend", bar);
      else if (charCount && charCount.parentNode) charCount.insertAdjacentElement("afterend", bar);
      else if (script && script.parentNode) script.insertAdjacentElement("afterend", bar);
      else panel.appendChild(bar);
    }
    try {
      const st = await api("/api/auth-video");
      const n = (st.script || []).length;
      bar.textContent = "脚本共 " + n + " 段 · 只读";
    } catch (_) {
      bar.textContent = "脚本段数暂不可用";
    }
  }

  /* 8 · 受益人关系一键复制 */
  async function ensureHeirRelationCopyButtons() {
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
      if (it.id != null) el.dataset.id = String(it.id);
      const rel = String(it.relation || "").trim();
      el.dataset.relation = rel;
      let btn = el.querySelector(".bn-copy-relation");
      if (!rel) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation";
      btn.textContent = "复制关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relation || "");
        softBanner(ok ? "已复制受益人关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册导出路径一键复制 */
  function ensureHandoverExportPathCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExportPathCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExportPathCopyCard";
      card.className = "hand-export-path-copy";
      const prog = $("#handProgressPctBar");
      const brand = $("#handBrandCopyCard");
      if (prog && prog.parentNode) prog.insertAdjacentElement("afterend", card);
      else if (brand && brand.parentNode) brand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    const line = "电子继承手册导出 · /export/handover.html · einherit.cn";
    card.innerHTML = `<p class="muted hand-export-path-copy-line">${esc(line)}</p>
      <button type="button" class="btn ghost sm" id="handExportPathCopyBtn">复制导出路径</button>`;
    const btn = $("#handExportPathCopyBtn");
    if (btn) {
      btn.onclick = async () => {
        const ok = await copyText(line);
        softBanner(ok ? "已复制手册导出路径" : "复制未完成", "handover");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  /* 10 · 设置·一键复制中英品牌对照 + round 层含 33 */
  function paintZhEnBrandCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#zhEnBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "zhEnBrandCopyCard";
      card.className = "card zh-en-brand-copy-card";
      const en = $("#enBrandCopyCard");
      const privacy = $("#privacyPathCopyCard");
      const roundList = $("#roundLayerListCard");
      if (en && en.parentNode) en.insertAdjacentElement("beforebegin", card);
      else if (privacy && privacy.parentNode) privacy.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    const line = "电子继承 App · E-Inherit";
    card.innerHTML = `<h3>中英品牌对照</h3>
      <p class="muted">一键复制中英文品牌对照行（演示级）。</p>
      <p class="zh-en-brand-copy-preview">${esc(line)}</p>
      <button type="button" class="btn ghost sm" id="zhEnBrandCopyBtn">复制中英品牌对照</button>`;
    const btn = $("#zhEnBrandCopyBtn");
    if (btn) {
      btn.onclick = async () => {
        const ok = await copyText(line);
        softBanner(ok ? "已复制中英品牌对照" : "复制未完成", "settings");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  function paintRoundLayerList33() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const found = [];
    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const m = src.match(/round(\d+)\.js/i);
      if (m) found.push(Number(m[1]));
    });
    const uniq = Array.from(new Set(found)).sort((a, b) => a - b);
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 33;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 33); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round33 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeMemberStatus().catch(() => {}), 150);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyNotesCopyButtons().catch(() => {}), 80);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => {
      bindAssetsVisibleCountObserver();
      paintAssetsVisibleCount();
    }, 80);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinDueCopy().catch(() => {}), 70);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelThresholdAmtCopy().catch(() => {}), 90);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareCityCopyButtons().catch(() => {}), 80);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => paintAuthScriptSegCount().catch(() => {}), 50);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirRelationCopyButtons().catch(() => {}), 80);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(ensureHandoverExportPathCopy, 90);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeMemberStatus().catch(() => {}), 160);
    if (id === "legacy") setTimeout(() => ensureLegacyNotesCopyButtons().catch(() => {}), 100);
    if (id === "assets") {
      setTimeout(() => {
        bindAssetsVisibleCountObserver();
        paintAssetsVisibleCount();
      }, 90);
    }
    if (id === "checkin") setTimeout(() => ensureCheckinDueCopy().catch(() => {}), 90);
    if (id === "travel") setTimeout(() => ensureTravelThresholdAmtCopy().catch(() => {}), 110);
    if (id === "aftercare") setTimeout(() => ensureAftercareCityCopyButtons().catch(() => {}), 100);
    if (id === "authvideo") setTimeout(() => paintAuthScriptSegCount().catch(() => {}), 70);
    if (id === "heirs") setTimeout(() => ensureHeirRelationCopyButtons().catch(() => {}), 90);
    if (id === "handover") setTimeout(ensureHandoverExportPathCopy, 100);
    if (id === "settings") {
      setTimeout(() => {
        paintZhEnBrandCopyCard();
        paintRoundLayerList33();
      }, 140);
      setTimeout(() => {
        paintZhEnBrandCopyCard();
        paintRoundLayerList33();
      }, 460);
    }
  };

  // Boot
  setTimeout(() => paintHomeMemberStatus().catch(() => {}), 210);
  setTimeout(() => ensureLegacyNotesCopyButtons().catch(() => {}), 230);
  setTimeout(() => {
    bindAssetsVisibleCountObserver();
    paintAssetsVisibleCount();
  }, 250);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinDueCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdAmtCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    paintAuthScriptSegCount().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExportPathCopy();
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintZhEnBrandCopyCard();
      paintRoundLayerList33();
    }, 160);
  }
})();
