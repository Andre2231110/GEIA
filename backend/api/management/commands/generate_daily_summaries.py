from django.core.management.base import BaseCommand

from api.models import Class
from api.tasks.generate_class_summary_task import GenerateClassSummaryTask


class Command(BaseCommand):
    help = "Gera os resumos das conversas não processadas de todas as turmas."

    def handle(self, *args, **options):
        classrooms = Class.objects.all().order_by("id")

        if not classrooms.exists():
            self.stdout.write(
                self.style.WARNING(
                    "Não existem turmas para processar."
                )
            )
            return

        processed = 0
        skipped = 0
        failed = 0

        for classroom in classrooms:
            self.stdout.write(
                f"A processar turma "
                f"{classroom.name} (ID: {classroom.id})..."
            )

            try:
                task = GenerateClassSummaryTask()

                summary = task.run(classroom)

                if summary is None:
                    skipped += 1

                    self.stdout.write(
                        self.style.WARNING(
                            f"Turma {classroom.name}: "
                            "sem conversas novas para processar."
                        )
                    )

                    continue

                processed += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Turma {classroom.name} processada. "
                        f"Resumo ID: {summary.id}"
                    )
                )

            except Exception as error:
                failed += 1

                self.stderr.write(
                    self.style.ERROR(
                        f"Erro ao processar a turma "
                        f"{classroom.name}: {error}"
                    )
                )

        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                "Processamento terminado. "
                f"Processadas: {processed}; "
                f"sem dados novos: {skipped}; "
                f"erros: {failed}."
            )
        )