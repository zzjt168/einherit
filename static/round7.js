/* 电子继承 · 第七批增量（叠在 round6.js / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const FAV_KEY = "einherit_med_favs";
  const ROLE_LABEL = {
    heir: "继承人",
    family: "家属",
    executor: "执行人",
    trustee: "受托人",
  };
  const ACTION_FILTERS = [
    { id: "", label: "全部" },
    { id: "destroy", label: "销毁", match: (a) => String(a).includes("销毁") && !String(a).includes("转赠") },
    { id: "sale", label: "变现", match: (a) => /变现|销售/.test(String(a)) },
    { id: "gift", label: "转赠", match: (a) => String(a).includes("转赠") },
    { id: "clear", label: "清除", match: (a) => /清除|清照片|清聊天|出厂/.test(String(a)) },
  ];

  function softBanner(msg, hostId) {
    const host = (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return;
    const eid = "round7SoftBanner_" + (hostId || "home");
    let el = document.getElementById(eid);
    if (!el) {
      el = document.createElement("div");
      el.id = eid;
      el.className = "ok soft-banner";
      el.hidden = true;
      host.insertBefore(el, host.firstChild);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.hidden = true;
    }, 4000);
  }

  function emptyState(title, hint, go, cta) {
    return `<div class="empty-state">
      <p class="empty-title">${esc(title)}</p>
      <p class="empty-hint">${esc(hint)}</p>
      ${
        go
          ? `<button class="btn ghost sm" data-go="${esc(go)}" type="button">${esc(
              cta || "去看看"
            )}</button>`
          : ""
      }
    </div>`;
  }

  function roleBadge(role) {
    const key = String(role || "").toLowerCase();
    const label = ROLE_LABEL[key] || role || "相关人";
    return `<span class="tag role-badge role-${esc(key || "other")}">${esc(label)}</span>`;
  }

  function getFavs() {
    try {
      const raw = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      return Array.isArray(raw) ? raw.map(Number).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  function setFavs(ids) {
    localStorage.setItem(FAV_KEY, JSON.stringify([...new Set(ids.map(Number).filter(Boolean))]));
  }

  function toggleFav(id) {
    const n = Number(id);
    const cur = getFavs();
    if (cur.includes(n)) setFavs(cur.filter((x) => x !== n));
    else setFavs([...cur, n]);
  }

  /* 1 · 首页缺口一句话 */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    try {
      const next = await api("/api/home-next");
      let bar = $("#homeNextStep");
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "homeNextStep";
        bar.className = "hint soft home-next";
        const hint = $("#homeHint");
        if (hint && hint.parentNode) hint.parentNode.insertBefore(bar, hint.nextSibling);
        else {
          const home = $("#home");
          if (home) home.insertBefore(bar, home.children[1] || null);
        }
      }
      bar.innerHTML = `<span>${esc(next.text || "")}</span>
        <button class="btn ghost sm" type="button" data-go="${esc(next.go || "company")}">${esc(
        next.cta || "下一步"
      )}</button>`;
    } catch (_) {}
  };

  /* 2 · 交割按处置筛选（叠在 round6 列表上） */
  let _lgActionFilter = "";
  let _lgCache = [];

  function ensureLegacyFilterBar() {
    let bar = $("#lgActionFilterBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "lgActionFilterBar";
    bar.className = "chip-row lg-action-filters";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按处置筛选");
    bar.innerHTML = ACTION_FILTERS.map(
      (f) =>
        `<button type="button" class="chip ${f.id === _lgActionFilter ? "active" : ""}" data-af="${esc(
          f.id
        )}">${esc(f.label)}</button>`
    ).join("");
    const list = $("#lgList");
    if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-af]");
      if (!btn) return;
      _lgActionFilter = btn.dataset.af || "";
      $$("#lgActionFilterBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.af || "") === _lgActionFilter)
      );
      renderLegacyFiltered();
    });
    return bar;
  }

  function matchActionFilter(action) {
    if (!_lgActionFilter) return true;
    const f = ACTION_FILTERS.find((x) => x.id === _lgActionFilter);
    return f && f.match ? f.match(action) : true;
  }

  function renderLegacyFiltered() {
    const list = $("#lgList");
    if (!list) return;
    ensureLegacyFilterBar();
    const items = (_lgCache || []).filter((it) => matchActionFilter(it.action));
    if (!items.length) {
      list.innerHTML = emptyState(
        "这一类暂时还没有安排",
        "换一个处置类型看看，或慢慢补一条即可。",
        "legacy",
        "继续补交割"
      );
      return;
    }
    list.innerHTML = items
      .map((it) => {
        const flags = [
          it.factory_reset ? "出厂重置" : null,
          it.clear_photos ? "清照片" : null,
          it.clear_chats ? "清聊天" : null,
        ]
          .filter(Boolean)
          .map((x) => `<span class="tag">${x}</span>`)
          .join("");
        return `<div class="item" data-id="${it.id}">
      <label class="lg-batch"><input type="checkbox" class="lg-check" data-id="${it.id}"/> 选入批量</label>
      <span class="tag">${DEPT_SHORT[it.dept] || DEPT_NAME[it.dept] || it.dept || ""}</span>
      <span class="tag">${esc(it.category)}</span>
      <span class="tag ${actionClass(it.action)}">${esc(it.action)}</span>
      ${flags}
      <strong>${esc(it.title)}</strong>
      <div class="muted">${it.beneficiary ? "接收人：" + esc(it.beneficiary) + " · " : ""}${esc(
          it.notes || ""
        )}</div>
    </div>`;
      })
      .join("");
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    try {
      const { items } = await api("/api/legacy");
      _lgCache = items || [];
      if (!_lgCache.length) {
        ensureLegacyFilterBar();
        $("#lgList").innerHTML = emptyState(
          "交割清单还是空的",
          "先写一条设备或账号的处置安排，给执行人一份冷静待办。",
          "legacy",
          "新增交割安排"
        );
        return;
      }
      renderLegacyFiltered();
    } catch (_) {}
  };

  /* 3 · 备忘关键词搜索 */
  function ensureAssetSearch() {
    let box = $("#asSearchBox");
    if (box) return box;
    box = document.createElement("div");
    box.id = "asSearchBox";
    box.className = "card filter-card";
    box.innerHTML = `<h3>关键词搜索</h3>
      <label class="field">平台名 / 摘要<input id="asSearchQ" placeholder="本机过滤，不上传"/></label>`;
    const list = $("#asList");
    if (list && list.parentNode) list.parentNode.insertBefore(box, list);
    box.querySelector("#asSearchQ").addEventListener("input", () => {
      const q = ($("#asSearchQ").value || "").trim().toLowerCase();
      $$("#asList .item").forEach((el) => {
        const hay = (el.textContent || "").toLowerCase();
        el.hidden = q ? !hay.includes(q) : false;
      });
      let tip = $("#asSearchEmpty");
      const visible = $$("#asList .item").filter((el) => !el.hidden);
      if (q && !visible.length) {
        if (!tip) {
          tip = document.createElement("div");
          tip.id = "asSearchEmpty";
          list.parentNode.insertBefore(tip, list.nextSibling);
        }
        tip.innerHTML = emptyState("没有匹配的备忘", "换个关键词，或再记一笔平台与处置指引。", "assets", "记一笔备忘");
      } else if (tip) tip.remove();
    });
    return box;
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    ensureAssetSearch();
    const list = $("#asList");
    if (!list) return;
    if (!list.querySelector(".item")) {
      list.innerHTML = emptyState(
        "还没有资产备忘",
        "记一笔平台与处置指引就好，不必一次写完。",
        "assets",
        "记一笔备忘"
      );
    }
  };

  /* 4 · 报备历史温和时间线（只读） */
  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    try {
      const hist = await api("/api/checkin/history?limit=8");
      const box = $("#checkinBox");
      if (!box) return;
      let card = $("#checkinHistCard");
      if (!card) {
        card = document.createElement("div");
        card.id = "checkinHistCard";
        card.className = "card";
        box.appendChild(card);
      }
      const items = hist.items || [];
      card.innerHTML = `<h3>报备历史</h3>
        <p class="muted">最近几次只读时间线，不改外呼升级流程。</p>
        <div class="list checkin-hist">${
          items.length
            ? items
                .map(
                  (it, i) =>
                    `<div class="item"><span class="tag">第 ${items.length - i} 次</span>
                    <strong>${esc(it.note || "生存报备")}</strong>
                    <div class="muted">${fmtTime(it.at)}</div></div>`
                )
                .join("")
            : "<p class='muted'>还没有报备记录。点上方「我已安全」即可留下第一条。</p>"
        }</div>`;
    } catch (_) {}
  };

  /* 5 · 差旅预存确认条 */
  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    const btn = $("#travelPay");
    if (!btn || btn.dataset.r7Bound) return;
    btn.dataset.r7Bound = "1";
    const prev = btn.onclick;
    btn.onclick = async () => {
      const amount = Number(($("#travelAmt") && $("#travelAmt").value) || 0);
      try {
        await api("/api/travel-fund", {
          method: "POST",
          body: JSON.stringify({ amount, force: amount < 2000 }),
        });
        toast("预存成功");
        softBanner(`差旅预存已记入 ${fmtMoney(amount)}，可按自己的节奏继续安排。`, "travel");
        softBanner(`差旅预存已记入 ${fmtMoney(amount)}，可按自己的节奏继续安排。`, "home");
        refreshTravel();
      } catch (e) {
        toast(e.message);
        if (typeof prev === "function") {
          /* keep calm; do not rethrow */
        }
      }
    };
  };

  /* 6 · 受益人角色角标 */
  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    try {
      const { items } = await api("/api/beneficiaries");
      const listHost = $("#heirsBox .list");
      if (!listHost) return;
      if (!(items || []).length) {
        listHost.innerHTML = emptyState(
          "名册还是空的",
          "先记下一位家人或执行人，交割时好对照。",
          "heirs",
          "添加受益人"
        );
        return;
      }
      listHost.innerHTML = items
        .map(
          (b) =>
            `<div class="item">${roleBadge(b.role)}<strong>${esc(b.name)}</strong>
            <div class="muted">${esc(b.relation || "")} · ${esc(b.contact || "")} ${esc(
              b.note || ""
            )}</div>
            ${
              b.passphrase_hint
                ? `<div class="muted">短码提示：${esc(b.passphrase_hint)}</div>`
                : ""
            }</div>`
        )
        .join("");
    } catch (_) {}
  };

  /* 7 · 交割手册应用内预览 */
  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    const box = $("#handoverBox");
    if (!box || $("#handPreviewCard")) return;
    const exportUrl = (typeof API_BASE !== "undefined" ? API_BASE.replace(/\/$/, "") : "") + "/export/handover.html";
    const card = document.createElement("div");
    card.id = "handPreviewCard";
    card.className = "card";
    card.innerHTML = `<h3>应用内预览</h3>
      <p class="muted">导出之外，可在此轻量预览说明页（只读）。</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <button class="btn ghost" type="button" id="handPreviewToggle">展开预览</button>
        <a class="btn ghost" href="${exportUrl}" target="_blank" rel="noopener">新窗口打开</a>
      </div>
      <iframe id="handPreviewFrame" class="hand-preview-frame" title="交割手册预览" hidden src="about:blank"></iframe>`;
    box.insertBefore(card, box.children[1] || null);
    $("#handPreviewToggle").onclick = () => {
      const frame = $("#handPreviewFrame");
      const open = frame.hidden;
      frame.hidden = !open;
      if (open) frame.src = exportUrl;
      $("#handPreviewToggle").textContent = open ? "收起预览" : "展开预览";
    };
  };

  /* 8 · 医旅医院收藏 */
  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q = "", country = "") {
    await _refreshMed(q, country);
    try {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (country) qs.set("country", country);
      const { items } = await api("/api/hospitals?" + qs.toString());
      const favs = getFavs();
      const sorted = [...(items || [])].sort((a, b) => {
        const af = favs.includes(Number(a.id)) ? 0 : 1;
        const bf = favs.includes(Number(b.id)) ? 0 : 1;
        return af - bf;
      });
      const list = $("#medList");
      if (!list) return;
      list.innerHTML =
        sorted
          .map((h) => {
            const starred = favs.includes(Number(h.id));
            return `<div class="item ${starred ? "med-fav" : ""}">
      <span class="tag">${esc(h.country)}</span>
      ${h.intl ? '<span class="tag">国际患者</span>' : ""}
      ${starred ? '<span class="tag fav-tag">常用</span>' : ""}
      <strong>${esc(h.name)}</strong>
      <div class="muted">${esc(h.city)} · ${esc(h.dept)}<br/>${esc(h.tags || "")}</div>
      <div class="row" style="gap:6px;flex-wrap:wrap">
        <button class="btn secondary" data-hid="${h.id}" type="button">提交就医意向</button>
        <button class="btn ghost sm med-fav-btn" data-fid="${h.id}" type="button">${
              starred ? "取消常用" : "标为常用"
            }</button>
      </div>
    </div>`;
          })
          .join("") || "<p class='muted'>无匹配医院</p>";

      $$("#medList [data-hid]").forEach((btn) => {
        btn.onclick = async () => {
          const note =
            ($("#medNote") && $("#medNote").value.trim()) || "希望顾问协助评估就医路径";
          await api("/api/hospitals/intent", {
            method: "POST",
            body: JSON.stringify({ hospital_id: Number(btn.dataset.hid), note }),
          });
          toast("意向已提交");
          refreshMed(
            ($("#medQ") && $("#medQ").value.trim()) || "",
            ($("#medCountry") && $("#medCountry").value) || ""
          );
        };
      });
      $$("#medList .med-fav-btn").forEach((btn) => {
        btn.onclick = () => {
          toggleFav(btn.dataset.fid);
          toast(getFavs().includes(Number(btn.dataset.fid)) ? "已标为常用" : "已取消常用");
          refreshMed(
            ($("#medQ") && $("#medQ").value.trim()) || "",
            ($("#medCountry") && $("#medCountry").value) || ""
          );
        };
      });
    } catch (_) {}
  };

  /* 9 · 设置·环境与版本条 */
  async function enhanceSettingsEnv() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsEnvCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsEnvCard";
      card.className = "card";
      box.insertBefore(card, box.firstChild);
    }
    try {
      const h = await api("/api/health");
      card.innerHTML = `<h3>环境与版本</h3>
        <p class="muted">减少「关于」跳转，设置页即可确认服务就绪。</p>
        <div class="stat" style="margin-top:10px">
          <div class="box"><span class="muted">App</span><b style="font-size:14px">${esc(
            h.version || "—"
          )}</b></div>
          <div class="box"><span class="muted">服务</span><b style="font-size:14px">${esc(
            h.server_version || "—"
          )}</b></div>
        </div>
        <p class="muted" style="margin-top:8px">${esc(h.app || "电子继承")} · ${esc(
        h.domain || "einherit.cn"
      )}</p>`;
    } catch (e) {
      card.innerHTML = `<h3>环境与版本</h3><p class="muted">暂不可用：${esc(e.message)}</p>`;
    }
  }

  /* 10 · 空状态统一文案（善后工单） */
  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    const list = $("#acList");
    if (!list) return;
    if (!list.querySelector(".item")) {
      list.innerHTML = emptyState(
        "暂无善后工单",
        "授权视频齐备后，再开一张温和工单即可。",
        "authvideo",
        "先看授权视频"
      );
    }
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "settings") {
      // round6 重建设置页后再挂环境条
      setTimeout(enhanceSettingsEnv, 0);
    }
  };
})();
