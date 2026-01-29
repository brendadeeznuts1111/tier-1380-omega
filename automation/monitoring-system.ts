#!/usr/bin/env bun

/**
 * Tier-1380 OMEGA Performance Monitoring
 * Automated monitoring and alerting for all system components
 */

import { Database } from "bun:sqlite";

interface MetricData {
	timestamp: number;
	value: number;
	tags: Record<string, string>;
}

interface AlertRule {
	name: string;
	metric: string;
	threshold: number;
	operator: ">" | "<" | "=" | ">=" | "<=";
	duration: number; // minutes
	severity: "low" | "medium" | "high" | "critical";
	enabled: boolean;
}

interface SystemHealth {
	component: string;
	status: "healthy" | "degraded" | "unhealthy";
	lastCheck: number;
	metrics: Record<string, number>;
	alerts: string[];
}

class OMEGAMonitor {
	private db: Database;
	private alertRules: AlertRule[];
	private systemHealth: Map<string, SystemHealth> = new Map();
	private metricsBuffer: Map<string, MetricData[]> = new Map();

	constructor() {
		this.db = new Database("monitoring.db");
		this.initializeDatabase();
		this.setupDefaultAlerts();
		this.startMonitoring();
	}

	private initializeDatabase(): void {
		// Metrics table
		this.db.run(`
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        value REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        tags TEXT, -- JSON string
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

		// Alerts table
		this.db.run(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_name TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        threshold REAL NOT NULL,
        actual_value REAL NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL, -- active, resolved, suppressed
        triggered_at INTEGER NOT NULL,
        resolved_at INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

		// System health table
		this.db.run(`
      CREATE TABLE IF NOT EXISTS system_health (
        component TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        last_check INTEGER NOT NULL,
        metrics TEXT, -- JSON string
        alerts TEXT, -- JSON array
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

		// Create indexes for performance
		this.db.run(
			"CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON metrics(metric_name, timestamp)",
		);
		this.db.run(
			"CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)",
		);
		this.db.run(
			"CREATE INDEX IF NOT EXISTS idx_health_component ON system_health(component)",
		);

		console.log("🗄️  Monitoring database initialized");
	}

	private setupDefaultAlerts(): void {
		this.alertRules = [
			{
				name: "CPU Usage High",
				metric: "cpu.usage_percent",
				threshold: 80,
				operator: ">",
				duration: 5,
				severity: "high",
				enabled: true,
			},
			{
				name: "Memory Usage High",
				metric: "memory.usage_percent",
				threshold: 85,
				operator: ">",
				duration: 5,
				severity: "high",
				enabled: true,
			},
			{
				name: "Database Response Time Slow",
				metric: "database.response_time_ms",
				threshold: 1000,
				operator: ">",
				duration: 2,
				severity: "medium",
				enabled: true,
			},
			{
				name: "S3 Upload Failure Rate",
				metric: "s3.upload_error_rate",
				threshold: 5,
				operator: ">",
				duration: 1,
				severity: "high",
				enabled: true,
			},
			{
				name: "WebSocket Connection Failure",
				metric: "websocket.connection_failure_rate",
				threshold: 10,
				operator: ">",
				duration: 1,
				severity: "medium",
				enabled: true,
			},
			{
				name: "CRC32 Performance Degraded",
				metric: "crc32.throughput_mbps",
				threshold: 1000,
				operator: "<",
				duration: 3,
				severity: "medium",
				enabled: true,
			},
		];

		console.log(`🚨 Loaded ${this.alertRules.length} alert rules`);
	}

	private startMonitoring(): void {
		console.log("📊 Starting Tier-1380 OMEGA monitoring...");

		// Collect metrics every 30 seconds
		setInterval(() => {
			this.collectMetrics();
		}, 30000);

		// Check alerts every minute
		setInterval(() => {
			this.checkAlerts();
		}, 60000);

		// Update system health every 2 minutes
		setInterval(() => {
			this.updateSystemHealth();
		}, 120000);

		// Cleanup old data every hour
		setInterval(() => {
			this.cleanupOldData();
		}, 3600000);

		// Initial collection
		this.collectMetrics();
	}

	private async collectMetrics(): Promise<void> {
		const timestamp = Date.now();

		// System metrics
		const systemMetrics = await this.collectSystemMetrics();
		this.recordMetrics(systemMetrics, timestamp);

		// Application metrics
		const appMetrics = await this.collectApplicationMetrics();
		this.recordMetrics(appMetrics, timestamp);

		// Database metrics
		const dbMetrics = await this.collectDatabaseMetrics();
		this.recordMetrics(dbMetrics, timestamp);

		// Network metrics
		const networkMetrics = await this.collectNetworkMetrics();
		this.recordMetrics(networkMetrics, timestamp);

		console.log(
			`📈 Collected ${Object.keys(systemMetrics).length + Object.keys(appMetrics).length + Object.keys(dbMetrics).length + Object.keys(networkMetrics).length} metrics`,
		);
	}

	private async collectSystemMetrics(): Promise<Record<string, number>> {
		// Simulate system metrics collection
		return {
			"cpu.usage_percent": Math.random() * 100,
			"memory.usage_percent": Math.random() * 100,
			"disk.usage_percent": Math.random() * 100,
			load_average_1m: Math.random() * 4,
			uptime_seconds: process.uptime(),
		};
	}

	private async collectApplicationMetrics(): Promise<Record<string, number>> {
		// Simulate application metrics
		return {
			"app.requests_per_second": Math.floor(Math.random() * 1000),
			"app.response_time_ms": Math.random() * 500,
			"app.error_rate": Math.random() * 5,
			"app.active_connections": Math.floor(Math.random() * 100),
		};
	}

	private async collectDatabaseMetrics(): Promise<Record<string, number>> {
		// Simulate database metrics
		return {
			"database.response_time_ms": Math.random() * 100,
			"database.connections_active": Math.floor(Math.random() * 20),
			"database.queries_per_second": Math.floor(Math.random() * 500),
			"database.cache_hit_rate": 80 + Math.random() * 20,
		};
	}

	private async collectNetworkMetrics(): Promise<Record<string, number>> {
		// Simulate network metrics
		return {
			"network.bytes_in_per_second": Math.random() * 1000000,
			"network.bytes_out_per_second": Math.random() * 1000000,
			"websocket.connections_active": Math.floor(Math.random() * 50),
			"s3.upload_time_ms": Math.random() * 2000,
			"s3.download_time_ms": Math.random() * 1000,
			"crc32.throughput_mbps": 1000 + Math.random() * 2000,
		};
	}

	private recordMetrics(
		metrics: Record<string, number>,
		timestamp: number,
	): void {
		const stmt = this.db.prepare(`
      INSERT INTO metrics (metric_name, value, timestamp, tags)
      VALUES (?, ?, ?, ?)
    `);

		for (const [name, value] of Object.entries(metrics)) {
			stmt.run(name, value, timestamp, JSON.stringify({}));

			// Add to buffer for recent metrics
			if (!this.metricsBuffer.has(name)) {
				this.metricsBuffer.set(name, []);
			}

			const buffer = this.metricsBuffer.get(name)!;
			buffer.push({ timestamp, value, tags: {} });

			// Keep only last 100 data points per metric
			if (buffer.length > 100) {
				buffer.shift();
			}
		}
	}

	private checkAlerts(): void {
		for (const rule of this.alertRules.filter((r) => r.enabled)) {
			this.evaluateAlertRule(rule);
		}
	}

	private evaluateAlertRule(rule: AlertRule): void {
		const recentMetrics = this.getRecentMetrics(rule.metric, rule.duration);

		if (recentMetrics.length === 0) {
			return;
		}

		// Check if threshold is breached for the specified duration
		const breachedMetrics = recentMetrics.filter((metric) => {
			switch (rule.operator) {
				case ">":
					return metric.value > rule.threshold;
				case "<":
					return metric.value < rule.threshold;
				case ">=":
					return metric.value >= rule.threshold;
				case "<=":
					return metric.value <= rule.threshold;
				case "=":
					return metric.value === rule.threshold;
				default:
					return false;
			}
		});

		const breachPercentage =
			(breachedMetrics.length / recentMetrics.length) * 100;

		if (breachPercentage >= 80) {
			// 80% of metrics must breach threshold
			this.triggerAlert(rule, breachedMetrics[breachedMetrics.length - 1]);
		} else {
			this.resolveAlert(rule);
		}
	}

	private getRecentMetrics(
		metricName: string,
		durationMinutes: number,
	): MetricData[] {
		const buffer = this.metricsBuffer.get(metricName) || [];
		const cutoffTime = Date.now() - durationMinutes * 60 * 1000;

		return buffer.filter((metric) => metric.timestamp >= cutoffTime);
	}

	private triggerAlert(rule: AlertRule, metric: MetricData): void {
		// Check if alert is already active
		const existingAlert = this.db
			.query(`
      SELECT * FROM alerts 
      WHERE rule_name = ? AND status = 'active'
    `)
			.get(rule.name) as any;

		if (existingAlert) {
			return; // Alert already active
		}

		// Create new alert
		this.db.run(
			`
      INSERT INTO alerts (rule_name, metric_name, threshold, actual_value, severity, status, triggered_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `,
			rule.name,
			rule.metric,
			rule.threshold,
			metric.value,
			rule.severity,
			metric.timestamp,
		);

		console.log(
			`🚨 ALERT TRIGGERED: ${rule.name} - ${rule.metric} = ${metric.value} (threshold: ${rule.threshold})`,
		);

		// Send notification (in real implementation)
		this.sendNotification(rule, metric);
	}

	private resolveAlert(rule: AlertRule): void {
		const existingAlert = this.db
			.query(`
      SELECT * FROM alerts 
      WHERE rule_name = ? AND status = 'active'
    `)
			.get(rule.name) as any;

		if (existingAlert) {
			this.db.run(
				`
        UPDATE alerts 
        SET status = 'resolved', resolved_at = ?
        WHERE rule_name = ? AND status = 'active'
      `,
				Date.now(),
				rule.name,
			);

			console.log(`✅ ALERT RESOLVED: ${rule.name}`);
		}
	}

	private sendNotification(rule: AlertRule, metric: MetricData): void {
		// Simulate notification sending
		const notification = {
			title: `Tier-1380 OMEGA Alert: ${rule.name}`,
			message: `${rule.metric} is ${metric.value} (threshold: ${rule.threshold})`,
			severity: rule.severity,
			timestamp: metric.timestamp,
		};

		console.log("📧 Notification sent:", notification);
	}

	private updateSystemHealth(): void {
		const components = [
			"database",
			"s3-storage",
			"websocket-server",
			"crc32-processor",
			"sql-helper",
			"api-server",
		];

		for (const component of components) {
			const health = this.assessComponentHealth(component);
			this.systemHealth.set(component, health);
			this.persistSystemHealth(component, health);
		}

		console.log(`🏥 Updated health for ${components.length} components`);
	}

	private assessComponentHealth(component: string): SystemHealth {
		const metrics = this.getComponentMetrics(component);
		const alerts = this.getComponentAlerts(component);

		let status: "healthy" | "degraded" | "unhealthy" = "healthy";

		// Assess status based on metrics and alerts
		const criticalAlerts = alerts.filter(
			(a) => a.severity === "critical",
		).length;
		const highAlerts = alerts.filter((a) => a.severity === "high").length;

		if (criticalAlerts > 0) {
			status = "unhealthy";
		} else if (highAlerts > 0 || this.hasPerformanceIssues(metrics)) {
			status = "degraded";
		}

		return {
			component,
			status,
			lastCheck: Date.now(),
			metrics,
			alerts: alerts.map((a) => a.rule_name),
		};
	}

	private getComponentMetrics(component: string): Record<string, number> {
		const componentMetrics: Record<string, number> = {};

		// Get relevant metrics for each component
		switch (component) {
			case "database":
				componentMetrics["response_time"] =
					this.getLatestMetric("database.response_time_ms") || 0;
				componentMetrics["connections"] =
					this.getLatestMetric("database.connections_active") || 0;
				break;
			case "s3-storage":
				componentMetrics["upload_time"] =
					this.getLatestMetric("s3.upload_time_ms") || 0;
				componentMetrics["download_time"] =
					this.getLatestMetric("s3.download_time_ms") || 0;
				break;
			case "websocket-server":
				componentMetrics["connections"] =
					this.getLatestMetric("websocket.connections_active") || 0;
				componentMetrics["failure_rate"] =
					this.getLatestMetric("websocket.connection_failure_rate") || 0;
				break;
			case "crc32-processor":
				componentMetrics["throughput"] =
					this.getLatestMetric("crc32.throughput_mbps") || 0;
				break;
			default:
				componentMetrics["response_time"] =
					this.getLatestMetric("app.response_time_ms") || 0;
				componentMetrics["error_rate"] =
					this.getLatestMetric("app.error_rate") || 0;
		}

		return componentMetrics;
	}

	private getComponentAlerts(component: string): any[] {
		// Get active alerts for this component
		return this.db
			.query(`
      SELECT * FROM alerts 
      WHERE status = 'active' AND metric_name LIKE ?
    `)
			.all(`%${component}%`) as any[];
	}

	private hasPerformanceIssues(metrics: Record<string, number>): boolean {
		// Check for performance issues based on metrics
		return Object.values(metrics).some((value) => {
			return (
				typeof value === "number" &&
				((value > 1000 && value < 10000) || // High response times
					(value > 90 && value < 100) || // High percentages
					value === 0) // Zero values might indicate issues
			);
		});
	}

	private getLatestMetric(metricName: string): number | null {
		const buffer = this.metricsBuffer.get(metricName);
		if (!buffer || buffer.length === 0) {
			return null;
		}

		return buffer[buffer.length - 1].value;
	}

	private persistSystemHealth(component: string, health: SystemHealth): void {
		this.db.run(
			`
      INSERT OR REPLACE INTO system_health (component, status, last_check, metrics, alerts)
      VALUES (?, ?, ?, ?, ?)
    `,
			component,
			health.status,
			health.lastCheck,
			JSON.stringify(health.metrics),
			JSON.stringify(health.alerts),
		);
	}

	private cleanupOldData(): void {
		const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago

		// Clean up old metrics
		const metricsDeleted = this.db.run(
			`
      DELETE FROM metrics WHERE timestamp < ?
    `,
			cutoffTime,
		).changes;

		// Clean up resolved alerts older than 30 days
		const alertCutoffTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
		const alertsDeleted = this.db.run(
			`
      DELETE FROM alerts WHERE status = 'resolved' AND resolved_at < ?
    `,
			alertCutoffTime,
		).changes;

		console.log(
			`🧹 Cleaned up ${metricsDeleted} old metrics and ${alertsDeleted} old alerts`,
		);
	}

	// Public API methods
	public getSystemHealth(): Map<string, SystemHealth> {
		return this.systemHealth;
	}

	public getActiveAlerts(): any[] {
		return this.db
			.query('SELECT * FROM alerts WHERE status = "active"')
			.all() as any[];
	}

	public getMetricsSummary(): Record<string, any> {
		const summary: Record<string, any> = {};

		for (const [metricName, buffer] of this.metricsBuffer.entries()) {
			if (buffer.length > 0) {
				const values = buffer.map((m) => m.value);
				summary[metricName] = {
					current: values[values.length - 1],
					min: Math.min(...values),
					max: Math.max(...values),
					avg: values.reduce((a, b) => a + b, 0) / values.length,
					count: values.length,
				};
			}
		}

		return summary;
	}

	public addAlertRule(rule: AlertRule): void {
		this.alertRules.push(rule);
		console.log(`➕ Added alert rule: ${rule.name}`);
	}

	public removeAlertRule(ruleName: string): void {
		this.alertRules = this.alertRules.filter((rule) => rule.name !== ruleName);
		console.log(`➖ Removed alert rule: ${ruleName}`);
	}
}

// Monitoring dashboard
class MonitoringDashboard {
	private monitor: OMEGAMonitor;

	constructor(monitor: OMEGAMonitor) {
		this.monitor = monitor;
	}

	public generateReport(): string {
		const health = this.monitor.getSystemHealth();
		const alerts = this.monitor.getActiveAlerts();
		const metrics = this.monitor.getMetricsSummary();

		let report = "# Tier-1380 OMEGA Monitoring Report\n\n";

		// System Health Overview
		report += "## 🏥 System Health\n\n";
		for (const [component, status] of health.entries()) {
			const emoji =
				status.status === "healthy"
					? "✅"
					: status.status === "degraded"
						? "⚠️"
						: "❌";
			report += `${emoji} **${component}**: ${status.status.toUpperCase()}\n`;
		}

		// Active Alerts
		report += "\n## 🚨 Active Alerts\n\n";
		if (alerts.length === 0) {
			report += "No active alerts\n";
		} else {
			for (const alert of alerts) {
				const severityEmoji = {
					low: "🟡",
					medium: "🟠",
					high: "🔴",
					critical: "💀",
				}[alert.severity];

				report += `${severityEmoji} **${alert.rule_name}**: ${alert.metric_name} = ${alert.actual_value} (threshold: ${alert.threshold})\n`;
			}
		}

		// Key Metrics
		report += "\n## 📊 Key Metrics\n\n";
		const keyMetrics = [
			"cpu.usage_percent",
			"memory.usage_percent",
			"database.response_time_ms",
			"app.response_time_ms",
			"crc32.throughput_mbps",
		];

		for (const metric of keyMetrics) {
			if (metrics[metric]) {
				const data = metrics[metric];
				report += `**${metric}**: ${data.current.toFixed(2)} (avg: ${data.avg.toFixed(2)}, min: ${data.min.toFixed(2)}, max: ${data.max.toFixed(2)})\n`;
			}
		}

		report += `\n📅 Generated: ${new Date().toISOString()}\n`;

		return report;
	}
}

// Main execution
async function main() {
	console.log("🚀 Starting Tier-1380 OMEGA Monitoring System...");

	const monitor = new OMEGAMonitor();
	const dashboard = new MonitoringDashboard(monitor);

	// Generate and display initial report
	console.log("\n" + dashboard.generateReport());

	// Keep the process running
	process.on("SIGINT", () => {
		console.log("\n🛑 Monitoring stopped");
		process.exit(0);
	});

	console.log("\n📡 Monitoring active... Press Ctrl+C to stop");
}

if (import.meta.main) {
	main();
}

export { OMEGAMonitor, MonitoringDashboard, type AlertRule, type SystemHealth };
