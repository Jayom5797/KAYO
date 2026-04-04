# Contributing to KAYO

Thank you for your interest in contributing to KAYO!

## Development Setup

1. Fork the repository
2. Clone your fork
3. Run setup script: `./scripts/setup-dev.sh`
4. Create a feature branch: `git checkout -b feature/amazing-feature`

## Code Standards

### Python (Backend)
- Python 3.12+
- Type hints required
- Follow PEP 8
- Use Black for formatting
- Maximum line length: 100 characters

```python
# Good
def process_incident(incident_id: uuid.UUID, tenant_id: uuid.UUID) -> Incident:
    """Process security incident with proper typing."""
    pass

# Bad
def process_incident(incident_id, tenant_id):
    pass
```

### TypeScript (Frontend)
- TypeScript 5.x
- Strict mode enabled
- Use functional components
- Follow React best practices

```typescript
// Good
interface IncidentProps {
  incidentId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export function IncidentCard({ incidentId, severity }: IncidentProps) {
  // ...
}

// Bad
export function IncidentCard(props: any) {
  // ...
}
```

## Testing Requirements

All code changes must include tests:

### Unit Tests
```bash
# Run unit tests
pytest tests/unit/ -v --cov

# Minimum coverage: 80%
```

### Integration Tests
```bash
# Run integration tests
pytest tests/integration/ -v
```

### Frontend Tests
```bash
cd frontend
npm run test
npm run lint
```

## Commit Messages

Follow conventional commits:

```
feat: add webhook retry logic
fix: resolve race condition in graph engine
docs: update API documentation
test: add unit tests for rate limiter
refactor: simplify authentication flow
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update PENDING_TASKS.md if applicable
5. Request review from maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally
```

## Code Review Guidelines

### For Authors
- Keep PRs focused and small
- Respond to feedback promptly
- Update based on review comments

### For Reviewers
- Review within 48 hours
- Be constructive and specific
- Test changes locally if needed

## Security

### Reporting Vulnerabilities
- Email: security@kayo.io
- Do NOT open public issues for security vulnerabilities
- Include detailed reproduction steps

### Security Best Practices
- Never commit secrets or credentials
- Use parameterized queries (no string concatenation)
- Validate all user input
- Follow principle of least privilege
- Enable security scanning in CI/CD

## Architecture Decisions

Major architectural changes require:
1. Discussion in GitHub issue
2. Design document
3. Team consensus
4. Documentation update

## Documentation

Update documentation for:
- New features
- API changes
- Configuration changes
- Breaking changes

Documentation locations:
- API: `API_DOCUMENTATION.md`
- User: `docs/USER_GUIDE.md`
- Operations: `docs/OPERATIONS_RUNBOOK.md`
- Deployment: `DEPLOYMENT_GUIDE.md`

## Performance

Performance-critical code must include:
- Time complexity analysis
- Memory complexity analysis
- Benchmarks (if applicable)

```python
def find_attack_path(start_node: str, end_node: str) -> List[str]:
    """
    Find shortest attack path between nodes.
    
    Time complexity: O(V + E) using BFS
    Space complexity: O(V) for visited set
    """
    pass
```

## Questions?

- GitHub Discussions: For general questions
- GitHub Issues: For bugs and feature requests
- Email: dev@kayo.io

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to KAYO! 🚀
