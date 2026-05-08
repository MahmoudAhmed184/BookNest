from celery import shared_task

from apps.search.services import rebuild_autocomplete_terms, rebuild_book_search_labels


@shared_task(name="apps.search.tasks.rebuild_search_index")
def rebuild_search_index() -> dict[str, int]:
    return {
        "book_documents": rebuild_book_search_labels(),
        "autocomplete_terms": rebuild_autocomplete_terms(),
    }
