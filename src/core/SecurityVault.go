
package security

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/base64"
    "errors"
    "time"
)

type SecurityVault struct {
    encryptionKey []byte
    entities      map[string]*EntityIdentity
    auditLog      []AuditEntry
}

type EntityIdentity struct {
    ID          string
    PublicKey   string
    PrivateKey  string
    CreatedAt   time.Time
    LastRotated time.Time
}

type AuditEntry struct {
    Timestamp   time.Time
    EntityID    string
    Action      string
    Success     bool
    IPAddress   string
}

func NewSecurityVault(key string) *SecurityVault {
    return &SecurityVault{
        encryptionKey: []byte(key),
        entities:      make(map[string]*EntityIdentity),
        auditLog:      []AuditEntry{},
    }
}

func (v *SecurityVault) RegisterEntity(entityID string) (*EntityIdentity, error) {
    if _, exists := v.entities[entityID]; exists {
        return nil, errors.New("entity already registered")
    }
    
    identity := &EntityIdentity{
        ID:          entityID,
        CreatedAt:   time.Now(),
        LastRotated: time.Now(),
    }
    
    publicKey, privateKey, err := v.generateKeyPair()
    if err != nil {
        return nil, err
    }
    
    identity.PublicKey = publicKey
    identity.PrivateKey = privateKey
    
    v.entities[entityID] = identity
    v.logAudit(entityID, "register", true)
    
    return identity, nil
}

func (v *SecurityVault) AuthenticateEntity(entityID string, token string) bool {
    identity, exists := v.entities[entityID]
    if !exists {
        return false
    }
    
    valid := v.verifyToken(token, identity.PublicKey)
    v.logAudit(entityID, "authenticate", valid)
    
    return valid
}

func (v *SecurityVault) Encrypt(data []byte) (string, error) {
    block, err := aes.NewCipher(v.encryptionKey)
    if err != nil {
        return "", err
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }
    
    nonce := make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return "", err
    }
    
    ciphertext := gcm.Seal(nonce, nonce, data, nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}
            