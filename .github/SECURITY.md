# Security Policy

## Supported Versions

This project is under active development. Security fixes are provided on a
best-effort basis for the latest released version or tag only.

| Version | Supported |
| ------- | --------- |
| Latest release/tag | :white_check_mark: |
| Older releases/tags | :x: |
| Unreleased local modifications | :x: |

If a vulnerability affects an older version, please still report it. We may use
the report to improve the latest supported release, but we do not guarantee
backports.

## Reporting a Vulnerability

Please **do not open a public GitHub issue** for security vulnerabilities.

Instead, use **GitHub Private Vulnerability Reporting / Security Advisories**
for this repository so the report can be reviewed confidentially.

When submitting a report, please include as much of the following as possible:

- A clear description of the issue
- The affected version, tag, branch, or commit SHA
- The impacted component or feature
- Steps to reproduce the issue
- Any proof-of-concept, logs, screenshots, or payloads
- The potential impact
- Any suggested mitigation or fix, if known

Reports with clear reproduction steps and impact details are much easier to
triage quickly.

## What to Expect From Maintainers

We aim to acknowledge valid reports on a best-effort basis, typically within a
few business days.

After acknowledgement, maintainers may:

- Request additional details or reproduction steps
- Confirm whether the issue is in scope
- Work on a fix or mitigation for the latest supported release
- Coordinate disclosure timing with the reporter when appropriate

Because this is an actively developed open-source project, response and
remediation times are not guaranteed.

## Disclosure Policy

Please allow maintainers reasonable time to investigate and prepare a fix or
mitigation before making details public.

We ask reporters to avoid:

- Public disclosure before coordinated release
- Publishing exploit code before a fix or mitigation is available
- Opening duplicate public issues for the same vulnerability

Once the issue is resolved, maintainers may disclose it in release notes, a
security advisory, or a repository announcement, with credit to the reporter if
they would like to be acknowledged.

## Scope Notes

Security reports should relate to this repository's code, dependencies, or
deployment-relevant behavior.

The following are generally out of scope unless they clearly create a security
impact in this project:

- Requests for general hardening advice
- Vulnerabilities only present in unsupported versions
- Issues caused solely by third-party services outside this repository
- Missing best practices without a demonstrable security impact

Thank you for helping improve the security of this project.
