## 一些废话

今天要探讨的是几个协议之间的细微区别。但感觉又是大部分 AI 撰写的一天。最近都在恶补各种东西，很少自己一个人沉浸式地脱离 AI 去思考一件事情，上一次还是 [[事如春夢了無痕，当时却只觉欢喜。]]

感觉已经好久远好久远了。无论如何，还是务必保持啊。

我们这次要探究起因是，我发现新版本的 codex-cli 已经完全遗弃了 chat_completion 转向 response。而我之前开发的时候为了省时间，只支持了 chat_completion

应该又是对话式的。

## 开始

我们先来召回一个沉在我碎碎念底部的一个疑惑：

:::note
可以探究一下为啥 anthropic 协议支持 tool token 和 chat token 交替，而 openai 只能先 tool 后 chat ，但是似乎用提示词注入又可以让它预告自己要执行的 tool。
它预告时是否得到了完整的 tool schema? 以及它是在哪一次 LLM call 进行预告?
:::

---

```shell
Run Swatinem/rust-cache@v2

(node:2247) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.

(Use `node --trace-deprecation ...` to show where the warning was created)

Cache Configuration

Cache Provider:

github

Workspaces:

/home/runner/work/yutto-uiya/yutto-uiya/src-tauri

Cache Paths:

/home/runner/.cargo/bin

/home/runner/.cargo/.crates.toml

/home/runner/.cargo/.crates2.json

/home/runner/.cargo/registry

/home/runner/.cargo/git

/home/runner/work/yutto-uiya/yutto-uiya/src-tauri/target

Restore Key:

v0-rust-lint-and-fmt-Linux-x64-db7c195c

Cache Key:

v0-rust-lint-and-fmt-Linux-x64-db7c195c-bb685052

.. Prefix:

- v0-rust-lint-and-fmt-Linux-x64

.. Environment considered:

- Rust Versions:

- 1.97.1 x86_64-unknown-linux-gnu 8bab26f4f68e0e26f0bb7960be334d5b520ea452

- 1.97.1 x86_64-unknown-linux-gnu 8bab26f4f68e0e26f0bb7960be334d5b520ea452

- CARGO_HOME

- CARGO_INCREMENTAL

- CARGO_TERM_COLOR

.. Lockfiles considered:

- /home/runner/work/yutto-uiya/yutto-uiya/src-tauri/Cargo.lock

- /home/runner/work/yutto-uiya/yutto-uiya/src-tauri/Cargo.toml

... Restoring cache ...

No cache found.

1m 17s

1s

55s

0s

8s

Post job cleanup.

Cache Configuration

(node:9404) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.

(Use `node --trace-deprecation ...` to show where the warning was created)

... Cleaning /home/runner/work/yutto-uiya/yutto-uiya/src-tauri/target ...

... Cleaning cargo registry (cache-all-crates: false) ...

... Cleaning cargo/bin ...

... Cleaning cargo git cache ...

... Saving cache ...

/usr/bin/tar --posix -cf cache.tzst --exclude cache.tzst -P -C /home/runner/work/yutto-uiya/yutto-uiya --files-from manifest.txt --use-compress-program zstdmt

Sent 6636811 of 409289995 (1.6%), 6.3 MBs/sec

Sent 275072267 of 409289995 (67.2%), 131.2 MBs/sec

Sent 409289995 of 409289995 (100.0%), 182.2 MBs/sec

1s

Node 20 is being deprecated. This workflow is running with Node 24 by default. If you need to temporarily use Node 20, you can set the ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true environment variable. For more information see: [https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)

Post job cleanup.

/usr/bin/git version

git version 2.54.0

Temporarily overriding HOME='/home/runner/work/_temp/87162c9d-7997-4d9d-9379-1ebb0ff9c568' before making global git config changes

Adding repository directory to the temporary git global config as a safe directory

/usr/bin/git config --global --add safe.directory /home/runner/work/yutto-uiya/yutto-uiya

/usr/bin/git config --local --name-only --get-regexp core\.sshCommand

/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"

/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader

http.[https://github.com/.extraheader](https://github.com/.extraheader)

/usr/bin/git config --local --unset-all http.[https://github.com/.extraheader](https://github.com/.extraheader)

/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.[https://github.com/.extraheader](https://github.com/.extraheader)' || :"

/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:

/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url

no cache found, can you fix with it?
```

---

```shell
I know. the two method dead in the even same time.

all dead when the agent start to ignore agents.md when long context.

and we only want to figure out one thing next.

Long Agents.md and short Agents.md.

you can put other skills directly in Agents.md and jian jin shi yin yong our memU retrieve in AGENTS.md.

then we are going to test last thing.

will the retrieve be affected by other skills that all contain in. is about the complex AGENTS.md will let the skill recall lower accuracy?and recall?

only need to verify this thing. I think it's right.

and the problem changes to into two parts:

will the Too Long AGENTS.md affect the SKILL recall probability?

And when will the agent start to ignore AGENTS.md and CLAUDE.md?

because we can't change is that, both two retrieve dead when the context is long.

Skill method can't prevent it.
```
