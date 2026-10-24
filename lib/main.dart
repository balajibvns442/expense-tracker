
import 'package:flutter/material.dart';
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ExpenseDb.instance.database;
  runApp(const ExpenseApp());
}

const categories = [
  'Food', 'Transport', 'Shopping', 'Bills',
  'Rent', 'Health', 'Entertainment', 'Other'
];

class ExpenseDb {
  ExpenseDb._();
  static final instance = ExpenseDb._();
  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    final path = p.join(await getDatabasesPath(), 'expenses.db');
    _db = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE expenses(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            amount REAL NOT NULL CHECK(amount > 0),
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            note TEXT NOT NULL DEFAULT ''
          )
        ''');
      },
    );
    return _db!;
  }

  Future<List<Map<String, Object?>>> all() async {
    final db = await database;
    return db.query('expenses', orderBy: 'date DESC, id DESC');
  }

  Future<void> add(Map<String, Object?> expense) async {
    final db = await database;
    await db.insert('expenses', expense);
  }

  Future<void> delete(int id) async {
    final db = await database;
    await db.delete('expenses', where: 'id = ?', whereArgs: [id]);
  }
}

class ExpenseApp extends StatelessWidget {
  const ExpenseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Expense Tracker',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<Map<String, Object?>> expenses = [];
  bool loading = true;
  final money = NumberFormat.currency(
    locale: 'en_IN', symbol: '₹', decimalDigits: 2,
  );
  final dateFormat = DateFormat('dd MMM yyyy');

  @override
  void initState() {
    super.initState();
    refresh();
  }

  Future<void> refresh() async {
    final data = await ExpenseDb.instance.all();
    if (!mounted) return;
    setState(() {
      expenses = data;
      loading = false;
    });
  }

  bool isThisMonth(Map<String, Object?> e) {
    final d = DateTime.parse(e['date'] as String);
    final now = DateTime.now();
    return d.year == now.year && d.month == now.month;
  }

  double get monthlyTotal => expenses
      .where(isThisMonth)
      .fold(0.0, (sum, e) => sum + (e['amount'] as num).toDouble());

  Map<String, double> get categoryTotals {
    final result = <String, double>{};
    for (final e in expenses.where(isThisMonth)) {
      final c = e['category'] as String;
      result[c] = (result[c] ?? 0) + (e['amount'] as num).toDouble();
    }
    return result;
  }

  Future<void> addExpense() async {
    final title = TextEditingController();
    final amount = TextEditingController();
    final note = TextEditingController();
    String category = categories.first;
    DateTime date = DateTime.now();

    final saved = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Add expense'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: title,
                  autofocus: true,
                  decoration: const InputDecoration(
                    labelText: 'Expense title',
                  ),
                ),
                TextField(
                  controller: amount,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: const InputDecoration(
                    labelText: 'Amount (₹)',
                  ),
                ),
                DropdownButtonFormField<String>(
                  value: category,
                  decoration: const InputDecoration(labelText: 'Category'),
                  items: categories.map((c) => DropdownMenuItem(
                    value: c, child: Text(c),
                  )).toList(),
                  onChanged: (v) {
                    if (v != null) setDialogState(() => category = v);
                  },
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  icon: const Icon(Icons.calendar_month),
                  label: Text(dateFormat.format(date)),
                  onPressed: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: date,
                      firstDate: DateTime(2000),
                      lastDate: DateTime.now(),
                    );
                    if (picked != null) {
                      setDialogState(() => date = picked);
                    }
                  },
                ),
                TextField(
                  controller: note,
                  decoration: const InputDecoration(
                    labelText: 'Note (optional)',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () async {
                final parsed = double.tryParse(amount.text.trim());
                if (title.text.trim().isEmpty ||
                    parsed == null ||
                    !parsed.isFinite ||
                    parsed <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Enter a title and a valid amount.'),
                    ),
                  );
                  return;
                }
                await ExpenseDb.instance.add({
                  'title': title.text.trim(),
                  'amount': parsed,
                  'category': category,
                  'date': DateFormat('yyyy-MM-dd').format(date),
                  'note': note.text.trim(),
                });
                if (dialogContext.mounted) {
                  Navigator.pop(dialogContext, true);
                }
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );

    title.dispose();
    amount.dispose();
    note.dispose();

    if (saved == true) await refresh();
  }

  Future<void> deleteExpense(int id) async {
    await ExpenseDb.instance.delete(id);
    await refresh();
  }

  Future<void> exportPdf() async {
    final current = expenses.where(isThisMonth).toList();
    final doc = pw.Document();
    final now = DateTime.now();
    final month = DateFormat('MMMM yyyy').format(now);
    final total = current.fold<double>(
      0, (sum, e) => sum + (e['amount'] as num).toDouble(),
    );

    doc.addPage(pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      build: (context) => [
        pw.Text('Expense Report',
            style: pw.TextStyle(
              fontSize: 24, fontWeight: pw.FontWeight.bold,
            )),
        pw.SizedBox(height: 6),
        pw.Text('Period: $month'),
        pw.Text('Generated: ${dateFormat.format(now)}'),
        pw.SizedBox(height: 16),
        pw.Text('Total spending: ${money.format(total)}',
            style: pw.TextStyle(
              fontSize: 16, fontWeight: pw.FontWeight.bold,
            )),
        pw.SizedBox(height: 16),
        pw.Text('Category summary',
            style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
        pw.SizedBox(height: 6),
        pw.Table(
          border: pw.TableBorder.all(color: PdfColors.grey400),
          children: [
            _pdfRow(['Category', 'Amount'], header: true),
            ...categoryTotals.entries.map((entry) =>
                _pdfRow([entry.key, money.format(entry.value)])),
          ],
        ),
        pw.SizedBox(height: 20),
        pw.Text('Transactions',
            style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
        pw.SizedBox(height: 6),
        pw.Table(
          border: pw.TableBorder.all(color: PdfColors.grey400),
          columnWidths: {
            0: const pw.FlexColumnWidth(2),
            1: const pw.FlexColumnWidth(1.1),
            2: const pw.FlexColumnWidth(1.3),
            3: const pw.FlexColumnWidth(1.5),
          },
          children: [
            _pdfRow(['Title', 'Category', 'Date', 'Amount'],
                header: true),
            ...current.map((e) => _pdfRow([
              e['title'] as String,
              e['category'] as String,
              e['date'] as String,
              money.format((e['amount'] as num).toDouble()),
            ])),
          ],
        ),
        if (current.isEmpty)
          pw.Padding(
            padding: const pw.EdgeInsets.only(top: 12),
            child: pw.Text('No expenses recorded this month.'),
          ),
      ],
    ));

    await Printing.sharePdf(
      bytes: await doc.save(),
      filename: 'expense_report_${DateFormat('yyyy_MM').format(now)}.pdf',
    );
  }

  pw.TableRow _pdfRow(List<String> values, {bool header = false}) {
    return pw.TableRow(
      decoration: header
          ? const pw.BoxDecoration(color: PdfColors.grey300)
          : null,
      children: values.map((value) => pw.Padding(
        padding: const pw.EdgeInsets.all(5),
        child: pw.Text(
          value,
          style: pw.TextStyle(
            fontSize: 9,
            fontWeight: header ? pw.FontWeight.bold : pw.FontWeight.normal,
          ),
        ),
      )).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final month = DateFormat('MMMM yyyy').format(DateTime.now());

    return Scaffold(
      appBar: AppBar(
        title: const Text('Expense Tracker'),
        actions: [
          IconButton(
            tooltip: 'Export monthly PDF',
            onPressed: exportPdf,
            icon: const Icon(Icons.picture_as_pdf),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: addExpense,
        icon: const Icon(Icons.add),
        label: const Text('Add expense'),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
        onRefresh: refresh,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(month,
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text('Total spent',
                        style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 4),
                    Text(
                      money.format(monthlyTotal),
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    Text('${expenses.where(isThisMonth).length} expenses'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text('Spending by category',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            if (categoryTotals.isEmpty)
              const ListTile(
                title: Text('No spending recorded this month'),
              )
            else
              ...categoryTotals.entries.map((entry) => ListTile(
                leading: const Icon(Icons.label_outline),
                title: Text(entry.key),
                trailing: Text(money.format(entry.value)),
              )),
            const SizedBox(height: 16),
            Text('All expenses',
                style: Theme.of(context).textTheme.titleLarge),
            if (expenses.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'No expenses yet. Tap Add expense to begin.',
                  textAlign: TextAlign.center,
                ),
              ),
            ...expenses.map((e) => Card(
              child: ListTile(
                title: Text(e['title'] as String),
                subtitle: Text(
                  '${e['category']} • ${dateFormat.format(DateTime.parse(e['date'] as String))}'
                      '${(e['note'] as String).isEmpty ? '' : '\n${e['note']}'}',
                ),
                isThreeLine: (e['note'] as String).isNotEmpty,
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(money.format(
                      (e['amount'] as num).toDouble(),
                    )),
                    PopupMenuButton<String>(
                      onSelected: (v) {
                        if (v == 'delete') {
                          deleteExpense(e['id'] as int);
                        }
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(
                          value: 'delete',
                          child: Text('Delete'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            )),
            const SizedBox(height: 88),
          ],
        ),
      ),
    );
  }
}
