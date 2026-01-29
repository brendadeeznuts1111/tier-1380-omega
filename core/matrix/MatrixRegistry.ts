/**
 * Tier-1380 OMEGA Matrix Registry
 * Team column ownership and profile link integration with visual badges
 */

import { profilePublisher, ProfileUrl } from '../profile/ProfilePublisher.ts';

export interface MatrixCell {
  column: number;
  row: number;
  team: string;
  value: any;
  profileUrl?: ProfileUrl;
  badge?: string;
  timestamp: number;
}

export interface MatrixColumn {
  id: number;
  team: string;
  owner: string;
  description: string;
  profileType?: 'cpu' | 'heap' | 'tension' | 'memory' | 'performance';
  cells: MatrixCell[];
  latestProfile?: ProfileUrl;
}

export interface MatrixGrid {
  columns: MatrixColumn[];
  rows: number;
  cols: number;
  metadata: {
    tier: string;
    environment: string;
    lastUpdated: number;
    totalProfiles: number;
  };
}

export class MatrixRegistry {
  private readonly maxColumns = 60;
  private readonly maxRows = 20;
  private grid: MatrixGrid;

  constructor() {
    this.grid = this.initializeGrid();
  }

  /**
   * Initialize empty matrix grid for Tier-1380 OMEGA
   */
  private initializeGrid(): MatrixGrid {
    const columns: MatrixColumn[] = [];
    
    // Create 60 columns for team ownership
    for (let i = 1; i <= this.maxColumns; i++) {
      columns.push({
        id: i,
        team: this.getTeamForColumn(i),
        owner: this.getOwnerForColumn(i),
        description: this.getColumnDescription(i),
        cells: [],
        profileType: this.getProfileTypeForColumn(i)
      });
    }

    return {
      columns,
      rows: this.maxRows,
      cols: this.maxColumns,
      metadata: {
        tier: '1380',
        environment: 'prod',
        lastUpdated: Date.now(),
        totalProfiles: 0
      }
    };
  }

  /**
   * Get team name for column number
   */
  private getTeamForColumn(column: number): string {
    if (column <= 20) return 'runtime';
    if (column <= 40) return 'compiler';
    return 'platform';
  }

  /**
   * Get owner for column number
   */
  private getOwnerForColumn(column: number): string {
    const team = this.getTeamForColumn(column);
    if (team === 'runtime') return `runtime-lead-${Math.ceil(column / 5)}`;
    if (team === 'compiler') return `compiler-lead-${Math.ceil((column - 20) / 5)}`;
    return `platform-lead-${Math.ceil((column - 40) / 5)}`;
  }

  /**
   * Get column description
   */
  private getColumnDescription(column: number): string {
    const team = this.getTeamForColumn(column);
    if (team === 'runtime') {
      const metrics = ['air-ir', 'buffer-speed', 'memory-alloc', 'gc-pressure', 'jit-optimization'];
      return metrics[(column - 1) % 5];
    }
    if (team === 'compiler') {
      const metrics = ['parse-time', 'codegen-speed', 'optimization-passes', 'bundle-size', 'tree-shake'];
      return metrics[(column - 21) % 5];
    }
    const metrics = ['boot-time', 'module-load', 'network-io', 'disk-io', 'system-calls'];
    return metrics[(column - 41) % 5];
  }

  /**
   * Get profile type for column
   */
  private getProfileTypeForColumn(column: number): MatrixColumn['profileType'] {
    const team = this.getTeamForColumn(column);
    if (team === 'runtime') return 'cpu';
    if (team === 'compiler') return 'tension';
    return 'memory';
  }

  /**
   * Add or update cell with profile link
   */
  addCellWithProfile(
    column: number,
    row: number,
    value: any,
    profileType: ProfileUrl['metadata']['type'],
    environment: string = 'prod'
  ): MatrixCell {
    const columnData = this.grid.columns.find(col => col.id === column);
    if (!columnData) {
      throw new Error(`Column ${column} not found`);
    }

    const profileUrl = profilePublisher.generateProfileUrl({
      type: profileType,
      environment: environment as any,
      timestamp: Date.now(),
      team: columnData.team,
      benchmark: `${columnData.description}-row${row}`
    });

    const cell: MatrixCell = {
      column,
      row,
      team: columnData.team,
      value,
      profileUrl,
      badge: profilePublisher.createProfileBadge(profileUrl),
      timestamp: Date.now()
    };

    // Update or add cell
    const existingIndex = columnData.cells.findIndex(c => c.row === row);
    if (existingIndex >= 0) {
      columnData.cells[existingIndex] = cell;
    } else {
      columnData.cells.push(cell);
    }

    // Update column latest profile
    columnData.latestProfile = profileUrl;

    // Update metadata
    this.grid.metadata.lastUpdated = Date.now();
    this.grid.metadata.totalProfiles = this.getTotalProfileCount();

    return cell;
  }

  /**
   * Get cells with profile links for a team
   */
  getTeamProfiles(team: string): MatrixCell[] {
    const cells: MatrixCell[] = [];
    
    this.grid.columns
      .filter(col => col.team === team)
      .forEach(col => {
        cells.push(...col.cells.filter(cell => cell.profileUrl));
      });

    return cells.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Query cells with profile links
   */
  queryCellsWithProfiles(options?: {
    team?: string;
    profileType?: ProfileUrl['metadata']['type'];
    environment?: string;
    limit?: number;
  }): MatrixCell[] {
    let cells: MatrixCell[] = [];

    this.grid.columns.forEach(col => {
      col.cells.forEach(cell => {
        if (!cell.profileUrl) return;
        
        if (options?.team && cell.team !== options.team) return;
        if (options?.profileType && cell.profileUrl.metadata.type !== options.profileType) return;
        if (options?.environment && cell.profileUrl.metadata.environment !== options.environment) return;
        
        cells.push(cell);
      });
    });

    cells.sort((a, b) => b.timestamp - a.timestamp);
    
    if (options?.limit) {
      cells = cells.slice(0, options.limit);
    }

    return cells;
  }

  /**
   * Generate visual matrix grid with profile badges
   */
  generateVisualGrid(): string {
    const grid: string[][] = [];
    
    for (let row = 1; row <= this.maxRows; row++) {
      const rowCells: string[] = [];
      
      for (let col = 1; col <= this.maxColumns; col++) {
        const column = this.grid.columns.find(c => c.id === col);
        const cell = column?.cells.find(c => c.row === row);
        
        if (cell?.badge) {
          rowCells.push(cell.badge);
        } else {
          // Show team color indicator
          const team = column?.team || 'unknown';
          const teamEmoji = team === 'runtime' ? '🔵' : 
                           team === 'compiler' ? '🔴' : 
                           team === 'platform' ? '🟣' : '⚪';
          rowCells.push(teamEmoji);
        }
      }
      
      grid.push(rowCells);
    }

    // Format as visual grid
    const header = 'Tier-1380 OMEGA Matrix Grid (Profile Badges):\n';
    const gridString = grid.map(row => row.join(' ')).join('\n');
    
    return header + gridString;
  }

  /**
   * Get matrix statistics
   */
  getStatistics(): {
    totalCells: number;
    cellsWithProfiles: number;
    profilesByType: Record<string, number>;
    profilesByTeam: Record<string, number>;
    profilesByEnvironment: Record<string, number>;
    coverage: number;
  } {
    const stats = {
      totalCells: this.maxColumns * this.maxRows,
      cellsWithProfiles: 0,
      profilesByType: {} as Record<string, number>,
      profilesByTeam: {} as Record<string, number>,
      profilesByEnvironment: {} as Record<string, number>,
      coverage: 0
    };

    this.grid.columns.forEach(col => {
      col.cells.forEach(cell => {
        if (cell.profileUrl) {
          stats.cellsWithProfiles++;
          
          const type = cell.profileUrl.metadata.type;
          stats.profilesByType[type] = (stats.profilesByType[type] || 0) + 1;
          
          stats.profilesByTeam[cell.team] = (stats.profilesByTeam[cell.team] || 0) + 1;
          
          const env = cell.profileUrl.metadata.environment;
          stats.profilesByEnvironment[env] = (stats.profilesByEnvironment[env] || 0) + 1;
        }
      });
    });

    stats.coverage = (stats.cellsWithProfiles / stats.totalCells) * 100;

    return stats;
  }

  /**
   * Export matrix data for backup/analysis
   */
  exportMatrix(): string {
    return JSON.stringify(this.grid, null, 2);
  }

  /**
   * Import matrix data
   */
  importMatrix(data: string): void {
    try {
      const imported = JSON.parse(data) as MatrixGrid;
      this.grid = imported;
      this.grid.metadata.lastUpdated = Date.now();
    } catch (error) {
      throw new Error('Invalid matrix data format');
    }
  }

  /**
   * Get total profile count across all columns
   */
  private getTotalProfileCount(): number {
    return this.grid.columns.reduce((total, col) => {
      return total + col.cells.filter(cell => cell.profileUrl).length;
    }, 0);
  }

  /**
   * Get column by ID
   */
  getColumn(columnId: number): MatrixColumn | undefined {
    return this.grid.columns.find(col => col.id === columnId);
  }

  /**
   * Get all columns for a team
   */
  getTeamColumns(team: string): MatrixColumn[] {
    return this.grid.columns.filter(col => col.team === team);
  }

  /**
   * Get matrix metadata
   */
  getMetadata(): MatrixGrid['metadata'] {
    return { ...this.grid.metadata };
  }
}

// Singleton instance
export const matrixRegistry = new MatrixRegistry();
