from api.models import ClassSummary


class SummaryRetriever:

    def get_context(self, classroom_id):

        summaries = (
            ClassSummary.objects
            .filter(classroom_id=classroom_id)
            .order_by("date")
        )

        if not summaries.exists():
            return "Não existem resumos disponíveis para esta turma."

        context = []

        for summary in summaries:
            context.append(
                f"Data: {summary.date}\n"
                f"Resumo: {summary.summary}"
            )

        return "\n\n---\n\n".join(context)