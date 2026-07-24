package security

type SecurityVault struct {
    entities map[string]string
}

func NewSecurityVault() *SecurityVault {
    return &SecurityVault{
        entities: make(map[string]string),
    }
}

func (v *SecurityVault) RegisterEntity(id string) error {
    v.entities[id] = "registered"
    return nil
}