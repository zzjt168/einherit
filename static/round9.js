/* 电子继承 · 第九批增量（叠在 round8/7/6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const ONBOARD_SKIP_KEY = "einherit_onboard_skip";
  const NOTE_FOLD_LEN = 48;
  let _pendingDept = "";
  let _acCityFilter = "";
  let _acCache9 = [];
  let _acStatusFilter9 = "";

  function onboardSkipped() {
    return localStorage.getItem(ONBOARD_SKIP_KEY) === "1";
  }

  function setOnboardSkip(v) {
    localStorage.setItem(ONBOARD_SKIP_KEY, v ? "1" : "0");
  }

  function softBanner(msg, hostId) {
    const host = (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return;
    const eid = "round9SoftBanner_" + (hostId || "home");
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

  function goCompanyDept(deptId) {
    _pendingDept = String(deptId || "");
    if (typeof show === "function") show("company");
    else if (typeof window.show === "function") window.show("company");
    setTimeout(() => highlightDept(_pendingDept), 80);
  }

  function highlightDept(deptId) {
    if (!deptId) return;
    $$("#companyBox .card.dept-highlight").forEach((c) => c.classList.remove("dept-highlight"));
    const el = document.getElementById("dept-" + deptId);
    if (!el) return;
    el.classList.add("dept-highlight");
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    let tip = el.querySelector(".gap-empty-tip");
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "ok gap-empty-tip";
      tip.textContent = "这里还空着。写一条盘点就好，不着急。";
      el.insertBefore(tip, el.children[1] || null);
    }
  }

  /* 1 · 五部门缺口深链（首页 + 盘点 chip → 部门高亮空位） */
  function renderHomeGapChips(gaps) {
    let bar = $("#homeGapChips");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeGapChips";
      bar.className = "gap-chips home-gap-chips";
      const hint = $("#homeHint");
      if (hint && hint.parentNode) hint.parentNode.insertBefore(bar, hint.nextSibling);
      else {
        const home = $("#home");
        if (home) home.appendChild(bar);
      }
    }
    const list = gaps || [];
    if (!list.length) {
      bar.innerHTML = "";
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    bar.innerHTML =
      `<span class="muted home-gap-label">盘点缺口</span>` +
      list
        .map(
          (g) =>
            `<button type="button" class="gap-chip" data-gap-dept="${esc(g.id)}">${esc(
              g.short || g.name
            )}</button>`
        )
        .join("");
    $$("#homeGapChips [data-gap-dept]").forEach((btn) => {
      btn.onclick = () => goCompanyDept(btn.dataset.gapDept);
    });
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    try {
      const co = await api("/api/company");
      renderHomeGapChips(co.gaps || []);
    } catch (_) {}
    try {
      await renderOnboarding();
    } catch (_) {}
  };

  const _refreshCompany = window.refreshCompany;
  window.refreshCompany = async function () {
    await _refreshCompany();
    $$("#companyBox [data-gap]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.gap;
        highlightDept(id);
      };
    });
    if (_pendingDept) {
      highlightDept(_pendingDept);
      _pendingDept = "";
    }
  };

  /* 10 · 首次引导可关闭（本机记住；设置可恢复） */
  async function renderOnboarding() {
    const box = $("#onboardGuide");
    if (!box) return;
    if (onboardSkipped()) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    const data = await api("/api/onboarding");
    if (data.complete) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    box.hidden = false;
    box.innerHTML = `<div class="onboard-head">
        <div>
          <div class="onboard-label">三步开始</div>
          <strong>按自己的节奏，先走完这几步即可</strong>
        </div>
        <button type="button" class="btn ghost sm" id="onboardSkipBtn">先跳过</button>
      </div>
      <ol class="onboard-steps">
        ${(data.steps || [])
          .map(
            (s, i) => `<li class="${s.done ? "done" : ""}">
          <button type="button" data-go="${esc(s.go || "home")}">
            <span class="ob-n">${s.done ? "✓" : i + 1}</span>
            <span><strong>${esc(s.title)}</strong><em>${esc(s.hint || "")}</em></span>
          </button>
        </li>`
          )
          .join("")}
      </ol>
      <p class="muted" style="margin:10px 0 0">进度 ${esc(String(data.done || 0))}/${esc(
      String(data.total || 3)
    )} · 跳过后可在设置恢复</p>`;
    const skip = $("#onboardSkipBtn");
    if (skip) {
      skip.onclick = () => {
        setOnboardSkip(true);
        box.hidden = true;
        softBanner("已先跳过引导，需要时可在设置里恢复。", "home");
      };
    }
  }

  function ensureOnboardRestoreCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#onboardRestoreCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "onboardRestoreCard";
      card.className = "card";
      box.appendChild(card);
    }
    const skipped = onboardSkipped();
    card.innerHTML = `<h3>首次引导</h3>
      <p class="muted">三步开始卡片可先跳过，本机记住；随时可再打开。</p>
      <label class="row large-toggle"><input type="checkbox" id="onboardRestoreToggle" ${
        skipped ? "" : "checked"
      }/> <span>显示首次引导（关闭即跳过）</span></label>`;
    const tog = $("#onboardRestoreToggle");
    if (tog) {
      tog.onchange = (e) => {
        const showGuide = e.target.checked;
        setOnboardSkip(!showGuide);
        toast(showGuide ? "已恢复首次引导" : "已跳过首次引导");
        if (typeof refreshHome === "function") refreshHome();
      };
    }
  }

  /* 2 · 交割备注折叠 */
  function foldLegacyNotes() {
    $$("#lgList .item").forEach((el) => {
      if (el.querySelector(".note-fold")) return;
      const muted = Array.from(el.querySelectorAll(".muted")).find((m) => {
        const t = (m.textContent || "").trim();
        return t.length > NOTE_FOLD_LEN && !m.querySelector("input,select,button");
      });
      if (!muted) return;
      const full = muted.textContent || "";
      muted.classList.add("note-fold", "collapsed");
      muted.dataset.full = full;
      muted.textContent = full.slice(0, NOTE_FOLD_LEN) + "…";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm note-expand";
      btn.textContent = "展开";
      btn.onclick = () => {
        const open = muted.classList.toggle("collapsed");
        if (open) {
          muted.textContent = (muted.dataset.full || "").slice(0, NOTE_FOLD_LEN) + "…";
          btn.textContent = "展开";
        } else {
          muted.textContent = muted.dataset.full || "";
          btn.textContent = "收起";
        }
      };
      muted.insertAdjacentElement("afterend", btn);
    });
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    foldLegacyNotes();
  };

  /* 3 · 备忘处置未填角标 + 一键补填 */
  function enhanceAssetsDisposeBadge() {
    $$("#asList .item[data-id]").forEach((el) => {
      if (el.querySelector(".dispose-missing-badge")) return;
      const muted = Array.from(el.querySelectorAll(".muted")).find((m) =>
        (m.textContent || "").includes("尚未填写")
      );
      const disposeLine = Array.from(el.querySelectorAll(".muted")).find((m) =>
        (m.textContent || "").includes("处置指引")
      );
      const text = disposeLine ? disposeLine.textContent || "" : "";
      const missing = muted || /处置指引：\s*$/.test(text) || text.includes("尚未填写");
      if (!missing) return;
      // also treat empty after colon
      if (disposeLine && /处置指引：\s*$/.test((disposeLine.textContent || "").trim())) {
        /* empty */
      } else if (!text.includes("尚未填写") && !muted) {
        // check via data - may already have note; skip if has content after 处置指引：
        const m = text.match(/处置指引：\s*(.*)$/);
        if (m && m[1] && !m[1].includes("尚未填写")) return;
      }
      const badge = document.createElement("span");
      badge.className = "tag dispose-missing-badge";
      badge.textContent = "待补处置";
      el.insertBefore(badge, el.firstChild);
      if (el.querySelector(".as-dispose-fill")) return;
      const wrap = document.createElement("div");
      wrap.className = "row as-dispose-fill";
      wrap.style.marginTop = "8px";
      wrap.innerHTML = `<select class="as-dispose-sel" aria-label="补填处置">
          <option value="">补填处置…</option>
          <option value="销毁">销毁</option>
          <option value="转赠">转赠</option>
          <option value="变现">变现</option>
        </select>
        <button type="button" class="btn ghost sm as-dispose-btn">保存</button>`;
      el.appendChild(wrap);
      const btn = wrap.querySelector(".as-dispose-btn");
      const sel = wrap.querySelector(".as-dispose-sel");
      btn.onclick = async () => {
        const v = (sel && sel.value) || "";
        if (!v) return toast("请先选择销毁 / 转赠 / 变现");
        try {
          await api("/api/assets/dispose", {
            method: "POST",
            body: JSON.stringify({ id: Number(el.dataset.id), dispose_note: v }),
          });
          toast("处置指引已补上");
          if (typeof refreshAssets === "function") refreshAssets();
        } catch (e) {
          toast(e.message);
        }
      };
    });
  }

  async function markMissingDisposeFromApi() {
    try {
      const pending = await api("/api/assets/dispose-pending");
      const ids = new Set((pending.items || []).map((x) => Number(x.id)));
      $$("#asList .item[data-id]").forEach((el) => {
        if (!ids.has(Number(el.dataset.id))) return;
        if (el.querySelector(".dispose-missing-badge")) return;
        const badge = document.createElement("span");
        badge.className = "tag dispose-missing-badge";
        badge.textContent = "待补处置";
        el.insertBefore(badge, el.firstChild);
        if (el.querySelector(".as-dispose-fill")) return;
        const wrap = document.createElement("div");
        wrap.className = "row as-dispose-fill";
        wrap.style.marginTop = "8px";
        wrap.innerHTML = `<select class="as-dispose-sel" aria-label="补填处置">
            <option value="">补填处置…</option>
            <option value="销毁">销毁</option>
            <option value="转赠">转赠</option>
            <option value="变现">变现</option>
          </select>
          <button type="button" class="btn ghost sm as-dispose-btn">保存</button>`;
        el.appendChild(wrap);
        const btn = wrap.querySelector(".as-dispose-btn");
        const sel = wrap.querySelector(".as-dispose-sel");
        btn.onclick = async () => {
          const v = (sel && sel.value) || "";
          if (!v) return toast("请先选择销毁 / 转赠 / 变现");
          try {
            await api("/api/assets/dispose", {
              method: "POST",
              body: JSON.stringify({ id: Number(el.dataset.id), dispose_note: v }),
            });
            toast("处置指引已补上");
            if (typeof refreshAssets === "function") refreshAssets();
          } catch (e) {
            toast(e.message);
          }
        };
      });
    } catch (_) {
      enhanceAssetsDisposeBadge();
    }
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    await markMissingDisposeFromApi();
  };

  /* 4 · 报备备用联系人摘要 */
  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    try {
      const data = await api("/api/backup-contacts/summary");
      const box = $("#checkinBox");
      if (!box) return;
      let card = $("#backupSummaryCard");
      if (!card) {
        card = document.createElement("div");
        card.id = "backupSummaryCard";
        card.className = "card";
        const first = box.querySelector(".card");
        if (first && first.nextSibling) box.insertBefore(card, first.nextSibling);
        else box.appendChild(card);
      }
      card.innerHTML = `<h3>备用联系人摘要</h3>
        <p class="muted">${esc(data.note || "只读摘要，不改外呼升级流程。")}</p>
        <div class="stat" style="margin-top:10px">
          <div class="box"><span class="muted">已登记</span><b style="font-size:16px">${esc(
            String(data.count || 0)
          )} 位</b></div>
          <div class="box"><span class="muted">姓名</span><b style="font-size:14px">${esc(
            (data.names || []).join("、") || "—"
          )}</b></div>
        </div>
        <p class="muted" style="margin-top:8px">${esc(data.text || "")}</p>`;
    } catch (_) {}
  };

  /* 5 · 会员到期温和提示 */
  const _refreshMember = window.refreshMember;
  window.refreshMember = async function () {
    await _refreshMember();
    try {
      const data = await api("/api/membership/gentle");
      const box = $("#memberBox .card");
      if (!box) return;
      let tip = $("#memberGentleTip");
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "memberGentleTip";
        tip.className = "ok member-gentle-tip";
        const stat = box.querySelector(".stat");
        if (stat) stat.insertAdjacentElement("afterend", tip);
        else box.appendChild(tip);
      }
      tip.innerHTML = `<strong>${esc(data.label || "会员")}</strong>
        <div class="muted">${esc(data.hint || "")}</div>`;
    } catch (_) {}
  };

  /* 6 · 工单城市筛选（叠在状态筛选上） */
  function syncAcStatusFromDom() {
    const active = $("#acStatusFilterBar .chip.active");
    _acStatusFilter9 = active ? active.dataset.acst || "" : "";
  }

  function ensureAftercareCityFilter() {
    let bar = $("#acCityFilterBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "acCityFilterBar";
    bar.className = "card filter-card ac-city-filter";
    bar.innerHTML = `<h3>按城市筛选</h3>
      <label class="field">城市
        <input id="acCityFilterInput" list="acCityDatalist" placeholder="下拉或输入城市"/>
      </label>
      <datalist id="acCityDatalist"></datalist>
      <div class="row" style="gap:8px;margin-top:6px">
        <button type="button" class="btn ghost sm" id="acCityFilterApply">筛选</button>
        <button type="button" class="btn ghost sm" id="acCityFilterClear">清除</button>
      </div>`;
    const list = $("#acList");
    const statusBar = $("#acStatusFilterBar");
    if (statusBar && statusBar.parentNode) statusBar.parentNode.insertBefore(bar, statusBar.nextSibling);
    else if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    bar.querySelector("#acCityFilterApply").onclick = () => {
      _acCityFilter = ($("#acCityFilterInput").value || "").trim();
      renderAftercareCityFiltered();
    };
    bar.querySelector("#acCityFilterClear").onclick = () => {
      _acCityFilter = "";
      const inp = $("#acCityFilterInput");
      if (inp) inp.value = "";
      renderAftercareCityFiltered();
    };
    bar.querySelector("#acCityFilterInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        _acCityFilter = (e.target.value || "").trim();
        renderAftercareCityFiltered();
      }
    });
    return bar;
  }

  function renderAftercareCityFiltered() {
    const list = $("#acList");
    if (!list) return;
    ensureAftercareCityFilter();
    syncAcStatusFromDom();
    const cityQ = (_acCityFilter || "").toLowerCase();
    const items = (_acCache9 || []).filter((it) => {
      if (_acStatusFilter9 && it.status_key !== _acStatusFilter9) return false;
      if (!cityQ) return true;
      return String(it.city || "")
        .toLowerCase()
        .includes(cityQ);
    });
    const labels =
      typeof SERVICE_LABEL !== "undefined"
        ? SERVICE_LABEL
        : {
            delete_data: "删除电子数据",
            sell_asset: "变卖电子资产",
            field_visit: "上门执行",
            legal_consult: "合规协办",
          };
    if (!items.length) {
      list.innerHTML = `<div class="empty-state">
        <p class="empty-title">这一筛选下暂时没有工单</p>
        <p class="empty-hint">换个城市或状态看看，或稍后再开一张温和工单。</p>
      </div>`;
      return;
    }
    list.innerHTML = items
      .map(
        (it) => `<div class="item" data-status-key="${esc(it.status_key || "")}" data-city="${esc(
          it.city || ""
        )}">
      <span class="tag status-${esc(it.status_key || "")}">${esc(it.status_label || it.status || "")}</span>
      <strong>${esc(it.title)}</strong>
      <div class="muted">${esc(labels[it.service_type] || it.service_type || "")}
        · ${esc(it.city || "未填城市")}
        · 差旅预算 ${fmtMoney(it.travel_budget)}
        · ${esc(it.coop_state || "")}</div>
      <div class="muted">${esc(it.visit_pref || "")} ${esc(it.notes || "")}</div>
    </div>`
      )
      .join("");
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    try {
      const [{ items }, cities] = await Promise.all([
        api("/api/aftercare"),
        api("/api/aftercare/cities").catch(() => ({ cities: [] })),
      ]);
      _acCache9 = items || [];
      ensureAftercareCityFilter();
      const dl = $("#acCityDatalist");
      if (dl) {
        dl.innerHTML = (cities.cities || [])
          .map((c) => `<option value="${esc(c)}"></option>`)
          .join("");
      }
      // re-bind status chips to also respect city
      const statusBar = $("#acStatusFilterBar");
      if (statusBar && !statusBar.dataset.round9Bound) {
        statusBar.dataset.round9Bound = "1";
        statusBar.addEventListener("click", () => {
          setTimeout(() => {
            syncAcStatusFromDom();
            // round8 already re-rendered; re-apply city on top of cache
            if (_acCityFilter) renderAftercareCityFiltered();
          }, 0);
        });
      }
      if (_acCityFilter) renderAftercareCityFiltered();
    } catch (_) {}
  };

  /* 7 · ICU 清册完成度条（只读进度 + 已有 checklist API） */
  const _refreshIcu = window.refreshIcu;
  window.refreshIcu = async function () {
    await _refreshIcu();
    try {
      const st = await api("/api/icu-checklist");
      const host = $("#icu .card") || $("#icu");
      if (!host) return;
      let bar = $("#icuProgressBar");
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "icuProgressBar";
        bar.className = "icu-progress";
        const hint = $("#icuCheckHint");
        if (hint) hint.insertAdjacentElement("beforebegin", bar);
        else host.appendChild(bar);
      }
      const pct = Number(st.pct != null ? st.pct : 0);
      bar.innerHTML = `<div class="icu-progress-meta">
          <span>${esc(st.progress_label || `进度 ${st.done || 0}/${st.total || 0}`)}</span>
          <span>${pct}%</span>
        </div>
        <div class="progress-bar" aria-hidden="true"><i style="width:${Math.max(
          0,
          Math.min(100, pct)
        )}%"></i></div>`;
      let list = $("#icuChecklistUi");
      if (!list) {
        list = document.createElement("div");
        list.id = "icuChecklistUi";
        list.className = "list icu-checklist-ui";
        bar.insertAdjacentElement("afterend", list);
      }
      list.innerHTML = (st.items || [])
        .map(
          (it) => `<label class="item icu-check-item">
          <input type="checkbox" class="icu-check" data-key="${esc(it.pack_key)}" ${
            it.checked ? "checked" : ""
          }/>
          <strong>${esc(it.title)}</strong>
          <div class="muted">${esc(it.category || "")} · ${esc(it.action || "")}</div>
        </label>`
        )
        .join("");
      $$("#icuChecklistUi .icu-check").forEach((cb) => {
        cb.onchange = async () => {
          try {
            await api("/api/icu-checklist", {
              method: "POST",
              body: JSON.stringify({ pack_key: cb.dataset.key, checked: cb.checked }),
            });
            softBanner(cb.checked ? "已记下这一项" : "已取消勾选", "icu");
            refreshIcu();
          } catch (e) {
            toast(e.message);
            cb.checked = !cb.checked;
          }
        };
      });
    } catch (_) {}
  };

  /* 8 · 快照列表温和对比 */
  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    try {
      const cmp = await api("/api/snapshots/compare");
      const box = $("#handoverBox");
      if (!box) return;
      let tip = $("#snapCompareTip");
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "snapCompareTip";
        tip.className = "ok snap-compare-tip";
        const snapCard = Array.from(box.querySelectorAll(".card")).find(
          (c) => (c.querySelector("h3") || {}).textContent === "历史快照"
        );
        if (snapCard) snapCard.insertBefore(tip, snapCard.children[1] || null);
        else box.appendChild(tip);
      }
      tip.textContent = cmp.text || "";
      tip.hidden = false;
    } catch (_) {}
  };

  /* 9 · 医旅国家快捷 chip */
  let _medRegion = "";
  function bindMedRegionChips() {
    const bar = $("#medRegionChips");
    if (!bar || bar.dataset.round9Bound) return;
    bar.dataset.round9Bound = "1";
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-region]");
      if (!btn) return;
      _medRegion = btn.dataset.region || "";
      $$("#medRegionChips .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.region || "") === _medRegion)
      );
      // 国内/国外用 region；具体国家仍走 select
      const country = _medRegion ? "" : ($("#medCountry") && $("#medCountry").value) || "";
      if ($("#medCountry") && _medRegion) $("#medCountry").value = "";
      if (typeof refreshMed === "function") {
        refreshMed(($("#medQ") && $("#medQ").value.trim()) || "", country, _medRegion);
      }
    });
  }

  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q = "", country = "", region) {
    const reg = region !== undefined ? region : _medRegion;
    bindMedRegionChips();
    if (reg) {
      // region 快捷筛选：直接拉 API，再交给下层尽量渲染列表
      try {
        const qs = new URLSearchParams();
        if (q) qs.set("q", q);
        qs.set("region", reg);
        const [{ items }, intents] = await Promise.all([
          api("/api/hospitals?" + qs.toString()),
          api("/api/hospitals/intents").catch(() => ({ items: [] })),
        ]);
        // 先走原 refreshMed 空 region 刷意向等，再覆盖列表
        await _refreshMed(q, country || "");
        const list = $("#medList");
        if (list) {
          list.innerHTML =
            (items || [])
              .map(
                (h) => `<div class="item">
            <strong>${esc(h.name)}</strong>
            <span class="tag">${esc(h.country)}</span>
            <div class="muted">${esc(h.city || "")} · ${esc(h.dept || "")}</div>
            <button class="btn ghost sm med-intent" data-hid="${h.id}" type="button">提交就医意向</button>
          </div>`
              )
              .join("") || "<p class='muted'>这一区域暂无医院，换个筛选看看。</p>";
          $$("#medList .med-intent").forEach((btn) => {
            btn.onclick = async () => {
              try {
                const note = ($("#medNote") && $("#medNote").value) || "";
                await api("/api/hospitals/intent", {
                  method: "POST",
                  body: JSON.stringify({ hospital_id: Number(btn.dataset.hid), note }),
                });
                toast("意向已提交");
                refreshMed(q, country, reg);
              } catch (e) {
                toast(e.message);
              }
            };
          });
        }
        void intents;
        return;
      } catch (e) {
        toast(e.message);
      }
    }
    await _refreshMed(q, country);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "settings") {
      setTimeout(() => ensureOnboardRestoreCard(), 0);
    }
    if (id === "company" && _pendingDept) {
      setTimeout(() => highlightDept(_pendingDept), 60);
    }
    if (id === "med") {
      setTimeout(() => bindMedRegionChips(), 0);
    }
  };

  // boot: bind chips if med already in DOM
  bindMedRegionChips();
  if ($("#home") && $("#home").classList.contains("active")) {
    renderOnboarding().catch(() => {});
  }
})();
