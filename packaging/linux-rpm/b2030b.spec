Name:           b2030b
Version:        0.1.0
Release:        1%{?dist}
Summary:        Browser 2030B — privacy-first, default-deny web browser

License:        MPL-2.0 AND Apache-2.0
URL:            https://b2030b.invalid
Source0:        %{name}-%{version}.tar.gz

Requires:       gtk3, webkit2gtk4.1

%description
A memory-safe, post-quantum-ready web browser. Telemetry, network egress, AI
features, and site permissions are default-deny and strictly opt-in.

%prep
%autosetup

%build
# The release binary is built by `./build engine release`; packaging only stages it.

%install
mkdir -p %{buildroot}%{_bindir}
install -m 0755 target/release/b2030b %{buildroot}%{_bindir}/b2030b
mkdir -p %{buildroot}%{_datadir}/applications
install -m 0644 packaging/linux-deb/b2030b.desktop %{buildroot}%{_datadir}/applications/b2030b.desktop

%files
%{_bindir}/b2030b
%{_datadir}/applications/b2030b.desktop
%license LICENSE

%changelog
* Thu Jun 05 2026 Browser 2030B Authors <maintainers@b2030b.invalid> - 0.1.0-1
- Initial package.
