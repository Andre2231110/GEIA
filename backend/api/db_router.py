class ProcessedDatabaseRouter:
    processed_models = {
        "processingbatch",
        "dailyclasssummary",
        "topicinsight",
        "frequentquestion",
    }

    def db_for_read(self, model, **hints):
        if model.__name__.lower() in self.processed_models:
            return "processed"
        return None

    def db_for_write(self, model, **hints):
        if model.__name__.lower() in self.processed_models:
            return "processed"
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == "api" and model_name in self.processed_models:
            return db == "processed"

        if app_label == "api":
            return db == "default"

        return None