use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct LearningModule {
    knowledge_base: HashMap<String, Knowledge>,
    learning_rate: f64,
    iterations: u32,
}

#[derive(Debug, Clone)]
pub struct Knowledge {
    pub key: String,
    pub value: String,
    pub confidence: f64,
    pub timestamp: u64,
}

impl LearningModule {
    pub fn new(learning_rate: f64) -> Self {
        LearningModule {
            knowledge_base: HashMap::new(),
            learning_rate,
            iterations: 0,
        }
    }
    
    pub fn learn(&mut self, key: String, value: String) -> bool {
        let knowledge = Knowledge {
            key: key.clone(),
            value: value.clone(),
            confidence: 1.0,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };
        
        self.knowledge_base.insert(key, knowledge);
        self.iterations += 1;
        println!("🧠 Learned: {} = {}", key, value);
        true
    }
    
    pub fn query(&self, key: &str) -> Option<String> {
        if let Some(knowledge) = self.knowledge_base.get(key) {
            if knowledge.confidence > 0.5 {
                return Some(knowledge.value.clone());
            }
        }
        None
    }
    
    pub fn update_confidence(&mut self, key: &str, new_confidence: f64) -> bool {
        if let Some(knowledge) = self.knowledge_base.get_mut(key) {
            knowledge.confidence = new_confidence;
            return true;
        }
        false
    }
    
    pub fn get_stats(&self) -> HashMap<String, u32> {
        let mut stats = HashMap::new();
        stats.insert("knowledge_entries".to_string(), self.knowledge_base.len() as u32);
        stats.insert("iterations".to_string(), self.iterations);
        stats
    }
}