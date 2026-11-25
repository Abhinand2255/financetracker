from django.urls import path
from .views import (
    ReportDataView,
    ExportCSVView,
    ExportExcelView,
    ExportPDFView,
)

urlpatterns = [
    path("summary/", ReportDataView.as_view(), name="report_summary"),
    path("export/csv/", ExportCSVView.as_view(), name="report_export_csv"),
    path("export/excel/", ExportExcelView.as_view(), name="report_export_excel"),
    path("export/pdf/", ExportPDFView.as_view(), name="report_export_pdf"),
]
