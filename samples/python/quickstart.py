#!/usr/bin/env python3
"""AI Power Ups quickstart in Python (standard library only).

Runs the acceptance checks from https://powerups-ai.store/docs/quickstart against a free
capability (0 credits) with at most eight sequential requests.

    AIPA_API_KEY=apa_live_... python3 quickstart.py                      # production
    AIPA_API_KEY=... AIPA_API_ORIGIN=http://127.0.0.1:5601 python3 quickstart.py
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

API = os.environ.get("AIPA_API_ORIGIN", "https://api.powerups-ai.store").rstrip("/")
KEY = os.environ.get("AIPA_API_KEY")
if not KEY:
    sys.exit("Set AIPA_API_KEY (a server-side secret).")


def call(method, path, body=None):
    """One request; returns (status, json, headers). Never raises on HTTP errors."""
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        API + path,
        data=data,
        method=method,
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            return res.status, json.load(res), res.headers
    except urllib.error.HTTPError as err:
        return err.code, json.load(err), err.headers


results = []


def check(name, ok, detail):
    results.append(ok)
    print(f"{'PASS' if ok else 'FAIL'} {name}: {detail}")
    if not ok:
        sys.exit(1)


started = time.monotonic()

status, account, _ = call("GET", "/v1/account")
check("account", status == 200 and account["credits"]["cap"] >= 500,
      f"plan {account.get('plan', {}).get('id')} cap {account.get('credits', {}).get('cap')}")

status, page, _ = call("POST", "/v1/capabilities/academic.search/execute",
                       {"query": "transformer attention", "sort": "cited", "num": 3})
check("execute", status == 200 and page["capability"] == "academic.search"
      and page["result_count"] == 3 and page["charged_credits"] == 0,
      f"{page.get('search_id')} {page.get('result_count')} results, charged {page.get('charged_credits')}")
if not page.get("results"):
    sys.exit("FAIL execute: no records to follow up")
first_ids = {r["record_id"] for r in page["results"]}

status, more, _ = call("POST", "/v1/follow-up", {"search_id": page["search_id"], "action": "more"})
check("more", status == 200 and more["search_id"] == page["search_id"]
      and all(r["record_id"] not in first_ids for r in more["results"]),
      f"{more.get('result_count')} new records on the same search")

record_id = page["results"][0]["record_id"]
s1, d1, _ = call("POST", "/v1/follow-up", {"record_id": record_id, "action": "details"})
s2, d2, _ = call("POST", "/v1/follow-up", {"record_id": record_id, "action": "details"})
check("details cached", s1 == 200 and s2 == 200 and d1["charged_credits"] == 0
      and d2.get("cached") is True and d2["charged_credits"] == 0,
      f"first charged {d1.get('charged_credits')}, second cached={d2.get('cached')}")

status, bad, _ = call("POST", "/v1/capabilities/academic.search/execute", {"query": "x", "bogus": True})
path = (bad.get("error", {}).get("violations") or [{}])[0].get("path")
check("unknown key", status == 400 and bad["error"]["code"] == "invalid_request" and path == "/bogus",
      f"violation path {path}")

status, unpaged, _ = call("POST", "/v1/follow-up", {"search_id": page["search_id"], "action": "nope"})
check("unknown action", status == 400 and unpaged["error"]["code"] == "invalid_request",
      unpaged.get("error", {}).get("message"))

elapsed = time.monotonic() - started
check("budget", elapsed < 60, f"{elapsed:.1f} s, 7 requests")

sys.exit(0 if all(results) else 1)
