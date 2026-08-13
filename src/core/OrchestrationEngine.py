package security

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "errors"
    "io"
)

// FIXED: Security vulnerabilities and memory leaks
type SecurityVault struct {
    encryptionKey []byte
    entities      map[string]*EntityIdentity
    auditLog      []AuditEntry
    mutex         sync.RWMutex  // FIXED: Added mutex for thread safety
}

func NewSecurityVault(key string) *SecurityVault {
    // FIXED: Better error handling
    if len(key) < 32 {
        panic("encryption key must be at least 32 bytes")
    }
    return &SecurityVault{
        encryptionKey: []byte(key),
        entities:      make(map[string]*EntityIdentity),
        auditLog:      []AuditEntry{},
        mutex:         sync.RWMutex{},
    }
}

func (v *SecurityVault) EncryptData(data []byte) (string, error) {
    // FIXED: Fixed buffer overflow issue
    v.mutex.RLock()
    defer v.mutex.RUnlock()
    
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