import csv
import io
from datetime import date
from decimal import Decimal
from django.http import HttpResponse
from django.db.models import Sum
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from transactions.models import Transaction, Category
from budgets.models import Budget
from budgets.services import get_budget_spending
from goals.models import SavingsGoal

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors


class ReportDataView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        report_type = request.query_params.get("report_type", "monthly")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        year = int(request.query_params.get("year", date.today().year))
        month = int(request.query_params.get("month", date.today().month))

        tx_qs = Transaction.objects.filter(user=user)

        if start_date and end_date:
            tx_qs = tx_qs.filter(date__gte=start_date, date__lte=end_date)
        elif report_type == "monthly":
            tx_qs = tx_qs.filter(date__year=year, date__month=month)
        elif report_type == "yearly":
            tx_qs = tx_qs.filter(date__year=year)

        income_total = tx_qs.filter(type="INCOME").aggregate(val=Sum("amount"))["val"] or Decimal("0.00")
        expense_total = tx_qs.filter(type="EXPENSE").aggregate(val=Sum("amount"))["val"] or Decimal("0.00")
        net_savings = income_total - expense_total

        # Category breakdown
        category_breakdown = []
        cat_expenses = (
            tx_qs.filter(type="EXPENSE")
            .values("category__name", "category__color")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )
        for cat in cat_expenses:
            category_breakdown.append({
                "category": cat["category__name"] or "Uncategorized",
                "color": cat["category__color"] or "#6B7280",
                "amount": float(cat["total"]),
                "percentage": round(float((cat["total"] / expense_total) * 100), 1) if expense_total > 0 else 0,
            })

        # Transactions
        transactions = []
        for t in tx_qs.order_by("-date")[:100]:
            transactions.append({
                "date": str(t.date),
                "title": t.title,
                "type": t.type,
                "category": t.category.name if t.category else "Uncategorized",
                "amount": float(t.amount),
                "payment_method": t.payment_method,
            })

        return Response({
            "report_type": report_type,
            "period": f"{month}/{year}" if report_type == "monthly" else str(year),
            "summary": {
                "income": float(income_total),
                "expenses": float(expense_total),
                "net_savings": float(net_savings),
                "savings_rate": round(float((net_savings / income_total) * 100), 1) if income_total > 0 else 0.0,
            },
            "category_breakdown": category_breakdown,
            "transactions": transactions,
        })


class ExportCSVView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        tx_type = request.query_params.get("type")

        qs = Transaction.objects.filter(user=user)
        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)
        if tx_type in ["INCOME", "EXPENSE"]:
            qs = qs.filter(type=tx_type)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="fintrack_transactions_{date.today()}.csv"'

        writer = csv.writer(response)
        writer.writerow(["Date", "Type", "Category", "Title", "Amount", "Payment Method", "Description"])

        for t in qs.order_by("-date"):
            writer.writerow([
                t.date,
                t.type,
                t.category.name if t.category else "Uncategorized",
                t.title,
                t.amount,
                t.payment_method,
                t.description,
            ])

        return response


class ExportExcelView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        qs = Transaction.objects.filter(user=user)
        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)

        wb = openpyxl.Workbook()
        ws_summary = wb.active
        ws_summary.title = "Financial Summary"

        header_font = Font(name="Arial", size=12, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")

        # Summary Sheet
        ws_summary["A1"] = "FinTrack Financial Report"
        ws_summary["A1"].font = Font(name="Arial", size=16, bold=True, color="1E3A8A")
        ws_summary["A2"] = f"Generated for: {user.username} ({user.email})"
        ws_summary["A3"] = f"Date: {date.today()}"

        income = qs.filter(type="INCOME").aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
        expense = qs.filter(type="EXPENSE").aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
        savings = income - expense

        ws_summary["A5"] = "Metric"
        ws_summary["B5"] = "Amount (INR)"
        ws_summary["A5"].font = header_font
        ws_summary["B5"].font = header_font
        ws_summary["A5"].fill = header_fill
        ws_summary["B5"].fill = header_fill

        ws_summary["A6"] = "Total Income"
        ws_summary["B6"] = float(income)
        ws_summary["A7"] = "Total Expenses"
        ws_summary["B7"] = float(expense)
        ws_summary["A8"] = "Net Savings"
        ws_summary["B8"] = float(savings)

        # Transactions Sheet
        ws_tx = wb.create_sheet(title="Transactions")
        headers = ["Date", "Type", "Category", "Title", "Amount", "Payment Method", "Description"]
        for col_num, h in enumerate(headers, 1):
            cell = ws_tx.cell(row=1, column=col_num, value=h)
            cell.font = header_font
            cell.fill = header_fill

        for row_num, t in enumerate(qs.order_by("-date"), 2):
            ws_tx.cell(row=row_num, column=1, value=str(t.date))
            ws_tx.cell(row=row_num, column=2, value=t.type)
            ws_tx.cell(row=row_num, column=3, value=t.category.name if t.category else "Uncategorized")
            ws_tx.cell(row=row_num, column=4, value=t.title)
            ws_tx.cell(row=row_num, column=5, value=float(t.amount))
            ws_tx.cell(row=row_num, column=6, value=t.payment_method)
            ws_tx.cell(row=row_num, column=7, value=t.description)

        response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response["Content-Disposition"] = f'attachment; filename="fintrack_report_{date.today()}.xlsx"'
        wb.save(response)
        return response


class ExportPDFView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        qs = Transaction.objects.filter(user=user)
        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            name="TitleStyle",
            parent=styles["Heading1"],
            fontSize=20,
            textColor=colors.HexColor("#1E3A8A"),
            spaceAfter=10,
        )
        subtitle_style = ParagraphStyle(
            name="SubTitleStyle",
            parent=styles["Normal"],
            fontSize=10,
            textColor=colors.HexColor("#4B5563"),
            spaceAfter=15,
        )

        elements = []
        elements.append(Paragraph("FinTrack – Financial Statement Report", title_style))
        elements.append(Paragraph(f"Account: {user.username} ({user.email}) | Date: {date.today()}", subtitle_style))

        income = qs.filter(type="INCOME").aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
        expense = qs.filter(type="EXPENSE").aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
        savings = income - expense

        summary_data = [
            ["Total Income", "Total Expenses", "Net Savings"],
            [f"INR {income}", f"INR {expense}", f"INR {savings}"],
        ]
        summary_table = Table(summary_data, colWidths=[160, 160, 160])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 11),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#F3F4F6")),
            ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 1), (-1, 1), 12),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 10),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))

        # Transactions
        tx_data = [["Date", "Type", "Category", "Title", "Amount"]]
        for t in qs.order_by("-date")[:50]:
            tx_data.append([
                str(t.date),
                t.type,
                t.category.name if t.category else "Uncategorized",
                t.title[:25],
                f"INR {t.amount}",
            ])

        tx_table = Table(tx_data, colWidths=[70, 70, 110, 150, 80])
        tx_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3B82F6")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
        ]))
        elements.append(tx_table)

        doc.build(elements)
        buffer.seek(0)

        response = HttpResponse(buffer, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="fintrack_report_{date.today()}.pdf"'
        return response
