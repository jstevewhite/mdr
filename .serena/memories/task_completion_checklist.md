# mdr - Task Completion Checklist

## Before Committing Code

### Code Quality Checks
- [ ] Run `go fmt ./...` to format Go code
- [ ] Run `go vet ./...` to check for issues
- [ ] Run `go test` to ensure tests pass
- [ ] Verify JavaScript code follows project conventions
- [ ] Check for any console.log statements in production code

### Build Verification
- [ ] Run `make build` to ensure successful compilation
- [ ] Test the built application with `make run`
- [ ] Verify frontend builds correctly with `cd frontend && npm run build`
- [ ] Check for any build warnings or errors

### Functionality Testing
- [ ] Test Markdown rendering with various file types
- [ ] Verify TOC generation works correctly
- [ ] Test auto-reload functionality
- [ ] Check theme switching (light/dark/theme)
- [ ] Verify font scaling controls
- [ ] Test keyboard shortcuts
- [ ] Validate Mermaid diagram rendering
- [ ] Check file size limits are enforced

## After Code Changes

### Cross-Platform Testing (if applicable)
- [ ] Test on macOS (primary platform)
- [ ] Test on Linux (primary platform)
- [ ] Optional: Test on Windows if available

### Configuration Testing
- [ ] Verify config file is created/updated correctly
- [ ] Test theme installation with `make install_themes`
- [ ] Check that settings persist between sessions

### Security Verification
- [ ] Test HTML sanitization with malicious content
- [ ] Verify CSP is working correctly
- [ ] Test file size limits
- [ ] Check that unsafe HTML mode requires explicit enablement

## Release Preparation

### Documentation Updates
- [ ] Update README.md with new features/changes
- [ ] Update any relevant documentation files
- [ ] Verify installation instructions are current

### Version Management
- [ ] Update version in `wails.json` if needed
- [ ] Consider updating Go module version
- [ ] Update any changelog or release notes

### Final Checks
- [ ] Run full test suite
- [ ] Verify all features work as expected
- [ ] Check for any performance regressions
- [ ] Ensure error messages are user-friendly

## Common Development Tasks

### Adding New Features
- [ ] Update relevant Go files
- [ ] Update frontend JavaScript if needed
- [ ] Add/update tests
- [ ] Update documentation
- [ ] Test across platforms

### Bug Fixes
- [ ] Reproduce the issue
- [ ] Fix the root cause
- [ ] Add regression test if applicable
- [ ] Verify fix works
- [ ] Test related functionality

### Dependency Updates
- [ ] Update Go dependencies in `go.mod`
- [ ] Update frontend dependencies in `package.json`
- [ ] Test with updated dependencies
- [ ] Check for breaking changes

## Git Workflow

### Before Push
- [ ] Run all tests
- [ ] Ensure code builds successfully
- [ ] Verify no sensitive data is committed
- [ ] Write descriptive commit messages

### Code Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included for new functionality
- [ ] Documentation is updated
- [ ] No unnecessary code changes
- [ ] Performance considerations addressed