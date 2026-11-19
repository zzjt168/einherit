/* 电子继承 · 第六批增量（叠在稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const LARGE_KEY = "einherit_large_text";

  function softBanner(msg) {
    let el = document.getElementById("checkinSoftBanner");
    if (!el) {
      el = document.createElement("div");
      el.id = "checkinSoftBanner";
      el.className = "ok soft-banner";
      el.hidden = true;
      const home = document.getElementById("home");
      if (home) home.insertBefore(el, home.firstChild);
      else return;
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(softBanner._t);
    softBanner._t = setTimeout(() => {
      el.hidden = true;
    }, 4000);
  }

  const _doQuick = window.doQuickCheckin;
  if (typeof _doQuick === "function") {
    window.doQuickCheckin = async function () {
      await _doQuick();
      softBanner("报备已记下，继续按自己的节奏盘点即可。");
    };
  }

  async function refreshSettings() {
    const box = $("#settingsBox");
    if (!box) return;
    const large = localStorage.getItem(LARGE_KEY) === "1";
    document.body.classList.toggle("large-text", large);
    let queue = { escalation_label: "—", aftercare_open: [], note: "" };
    try {
      queue = await api("/api/execution-queue");
    } catch (_) {}
    const jobs =
      (queue.aftercare_open || [])
        .map(
          (j) =>
            `<div class="item"><strong>${esc(j.title || "善后工单")}</strong>
            <div class="muted">${esc(j.status_label || j.status || "")} · 差旅预算 ${fmtMoney(
              j.travel_budget
            )}</div></div>`
        )
        .join("") || "<p class='muted'>暂无待处理工单</p>";
    box.innerHTML = `
      <div class="card">
        <h3>执行队列（只读）</h3>
        <p class="muted">${esc(queue.note || "只读展示当前升级与待办，不改外呼流程。")}</p>
        <div class="stat" style="margin-top:10px">
          <div class="box"><span class="muted">升级状态</span><b style="font-size:15px">${esc(
            queue.escalation_label || queue.escalation_state || "—"
          )}</b></div>
        </div>
        <div class="list" style="margin-top:10px">${jobs}</div>
      </div>
      <div class="card">
        <h3>阅读体验</h3>
        <label class="row large-toggle"><input type="checkbox" id="largeTextToggle" ${
          large ? "checked" : ""
        }/> <span>更大字号（本机记住）</span></label>
      </div>
      <div class="card">
        <h3>数据导入（演示）</h3>
        <p class="muted">与 JSON 导出对称。先预览条数，确认后再写入。</p>
        <label class="field">粘贴导出 JSON<textarea id="importPackJson" rows="5" placeholder='{"legacy":[],"assets":[],"beneficiaries":[]}'></textarea></label>
        <div class="row" style="gap:8px">
          <button class="btn ghost" id="importPreview" type="button">预览</button>
          <button class="btn" id="importConfirm" type="button">确认导入</button>
        </div>
        <p class="muted" id="importResult" style="margin-top:8px"></p>
      </div>
      <div class="card calm-note">
        <button class="btn ghost" data-go="about" type="button">隐私与边界</button>
        <button class="btn ghost" data-go="appAbout" type="button">关于与自检</button>
      </div>`;
    $("#largeTextToggle").onchange = (e) => {
      const on = e.target.checked;
      localStorage.setItem(LARGE_KEY, on ? "1" : "0");
      document.body.classList.toggle("large-text", on);
      toast(on ? "已开大字号" : "已恢复默认字号");
    };
    const runImport = async (confirm) => {
      const raw = $("#importPackJson").value.trim();
      if (!raw) return toast("请先粘贴 JSON");
      let pack;
      try {
        pack = JSON.parse(raw);
      } catch {
        return toast("JSON 格式不正确");
      }
      try {
        const r = await api("/api/export/import", {
          method: "POST",
          body: JSON.stringify({ pack, confirm }),
        });
        $("#importResult").textContent = confirm
          ? r.message || "已导入"
          : `预览：交割 ${r.preview.legacy_count} · 备忘 ${r.preview.assets_count} · 受益人 ${r.preview.beneficiaries_count}`;
        toast(confirm ? "导入完成" : "已生成预览，确认无误后再导入");
      } catch (err) {
        toast(err.message);
      }
    };
    $("#importPreview").onclick = () => runImport(false);
    $("#importConfirm").onclick = () => runImport(true);
  }

  function refreshAppAbout() {
    const btn = $("#aboutHealthBtn");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.onclick = async () => {
      try {
        const h = await api("/api/health");
        $("#aboutAppVer").textContent = h.version || "—";
        $("#aboutSrvVer").textContent = h.server_version || "—";
        $("#aboutHealthResult").textContent = `就绪 · ${h.app || "电子继承"} · ${
          h.domain || "einherit.cn"
        } · ${h.server_version || ""}`;
        toast("服务就绪");
      } catch (e) {
        $("#aboutHealthResult").textContent = e.message;
        toast(e.message);
      }
    };
  }

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "settings") refreshSettings();
    if (id === "appAbout") refreshAppAbout();
  };

  const _refreshMember = window.refreshMember;
  window.refreshMember = async function () {
    await _refreshMember();
    const box = $("#memberBox");
    if (!box || box.querySelector(".benefit-card")) return;
    const benefits = document.createElement("div");
    benefits.className = "card benefit-card";
    benefits.innerHTML = `<h3>会员权益（冷静清单）</h3>
      <ul class="benefit-list">
        <li>按您设定频率的生存报备守望</li>
        <li>电子交割与资产备忘托管入口</li>
        <li>差旅预存账本与断缴退回状态可读</li>
        <li>授权视频与善后工单门槛说明</li>
      </ul>
      <p class="muted">真实支付未接入；本页为演示开通/续费。</p>`;
    box.appendChild(benefits);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    try {
      const [{ items }, fundWrap] = await Promise.all([
        api("/api/aftercare"),
        api("/api/travel-fund"),
      ]);
      const sum = (items || []).reduce((a, it) => a + Number(it.travel_budget || 0), 0);
      const bal = Number((fundWrap.fund && fundWrap.fund.balance) || 0);
      let tip = $("#acBudgetSumTip");
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "acBudgetSumTip";
        tip.className = "calm-nudge";
        const list = $("#acList");
        if (list && list.parentNode) list.parentNode.insertBefore(tip, list);
      }
      tip.textContent =
        sum > bal
          ? `工单差旅合计约 ${fmtMoney(sum)}，当前预存 ${fmtMoney(bal)}，可先在差旅页补足演示余额。`
          : `工单差旅合计约 ${fmtMoney(sum)}，预存 ${fmtMoney(bal)}，看起来够用。`;
    } catch (_) {}
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    const { items } = await api("/api/legacy");
    $("#lgList").innerHTML =
      (items || [])
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
        .join("") || "<p class='muted'>暂无条目</p>";

    let bar = $("#lgBatchBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "lgBatchBar";
      bar.className = "card";
      bar.innerHTML = `<h3>批量标记处置</h3>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <select id="lgBatchAction">
            <option>销毁</option><option>变现</option><option>转赠</option><option>清除</option>
          </select>
          <button class="btn" id="lgBatchApply" type="button">应用到勾选</button>
        </div>`;
      const list = $("#lgList");
      if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
      $("#lgBatchApply").onclick = async () => {
        const ids = $$("#lgList .lg-check:checked").map((c) => Number(c.dataset.id));
        try {
          await api("/api/legacy/batch-action", {
            method: "POST",
            body: JSON.stringify({ ids, action: $("#lgBatchAction").value }),
          });
          toast("已批量更新处置类型");
          refreshLegacy();
        } catch (e) {
          toast(e.message);
        }
      };
    }
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    const { items } = await api("/api/assets");
    const today = new Date().toISOString().slice(0, 10);
    $("#asList").innerHTML =
      (items || [])
        .map((it) => {
          const due = (it.review_at || "").slice(0, 10);
          const overdue = due && due <= today;
          const badge = due
            ? `<span class="tag ${overdue ? "review-due" : "review-soon"}">检视 ${esc(due)}</span>`
            : `<span class="tag muted-tag">未设检视日</span>`;
          return `<div class="item" data-id="${it.id}">
      <span class="tag">${DEPT_SHORT[it.dept] || DEPT_NAME[it.dept] || ""}</span>
      <span class="tag">${esc(it.visibility)}</span>
      ${badge}
      <strong>${esc(it.platform)}</strong>
      <div class="muted">${esc(it.account_hint || "")} · ${esc(it.summary || "")}</div>
      <div class="muted">处置指引：${
        it.dispose_note
          ? esc(it.dispose_note)
          : "尚未填写 — 选销毁 / 转赠 / 变现即可，慢慢来"
      }</div>
      <label class="field review-field">下次检视
        <input type="date" class="as-review" data-id="${it.id}" value="${esc(due)}"/>
      </label>
    </div>`;
        })
        .join("") ||
      "<p class='muted'>暂无备忘。记一笔平台与处置指引就好，不必一次写完。</p>";

    $$("#asList .as-review").forEach((inp) => {
      inp.onchange = async () => {
        try {
          await api("/api/assets/review-at", {
            method: "POST",
            body: JSON.stringify({ id: Number(inp.dataset.id), review_at: inp.value }),
          });
          toast(inp.value ? "已记下检视日" : "已清除检视日");
          refreshAssets();
        } catch (e) {
          toast(e.message);
        }
      };
    });
  };

  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q = "", country = "") {
    await _refreshMed(q, country);
    try {
      const intents = await api("/api/hospitals/intents").catch(() => ({ items: [] }));
      const intentBox = $("#medIntents");
      if (!intentBox) return;
      intentBox.innerHTML =
        (intents.items || []).length
          ? intents.items
              .map((it) => {
                const st = it.status || "pending";
                const label = it.status_label || { pending: "待联系", open: "待联系", contacted: "已联系", cancelled: "已取消" }[st] || st;
                return `<div class="item" data-id="${it.id}">
          <span class="tag status-${esc(st)}">${esc(label)}</span>
          <strong>${esc(it.hospital_name || "未指定医院")}</strong>
          <div class="muted">${esc(it.hospital_country || "")} ${esc(it.hospital_city || "")}
            · ${esc(it.note || "")}<br/>${fmtTime(it.created_at)}</div>
          <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap">
            <button class="btn ghost sm med-st" data-id="${it.id}" data-st="pending" type="button">待联系</button>
            <button class="btn ghost sm med-st" data-id="${it.id}" data-st="contacted" type="button">已联系</button>
            <button class="btn ghost sm med-st" data-id="${it.id}" data-st="cancelled" type="button">已取消</button>
          </div>
        </div>`;
              })
              .join("")
          : "<p class='muted'>还没有意向单。筛选医院后点「提交就医意向」即可。</p>";
      $$("#medIntents .med-st").forEach((btn) => {
        btn.onclick = async () => {
          try {
            await api("/api/med-intent/status", {
              method: "POST",
              body: JSON.stringify({ id: Number(btn.dataset.id), status: btn.dataset.st }),
            });
            toast("意向状态已更新");
            refreshMed(
              ($("#medQ") && $("#medQ").value.trim()) || "",
              ($("#medCountry") && $("#medCountry").value) || ""
            );
          } catch (e) {
            toast(e.message);
          }
        };
      });
    } catch (_) {}
  };

  document.body.classList.toggle("large-text", localStorage.getItem(LARGE_KEY) === "1");
})();
