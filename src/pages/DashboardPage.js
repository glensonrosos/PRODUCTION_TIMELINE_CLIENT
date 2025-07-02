import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Typography, Paper, CircularProgress, Alert, Box, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, TablePagination, TextField, Chip, Link,
  FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, OutlinedInput
} from '@mui/material';
import { WarningAmber as WarningAmberIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import seasonService from '../services/seasonService';
import buyerService from '../services/buyerService';
import departmentService from '../services/departmentService';

const headCells = [
  { id: 'name', label: 'Season Name', sortable: true },
  { id: 'buyer', label: 'Buyer', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'createdAt', label: 'Date Created', sortable: true },
  { id: 'requireAttention', label: 'Need Attention', sortable: false },
];

const getStatusChipColor = (status) => {
  switch (status) {
    case 'Open': return 'primary';
    case 'Closed': return 'success';
    case 'On-Hold': return 'warning';
    case 'Canceled': return 'error';
    default: return 'default';
  }
};

const DashboardPage = () => {
  const location = useLocation();
  const [seasons, setSeasons] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalSeasons, setTotalSeasons] = useState(0);
  const [searchType, setSearchType] = useState('seasonName');
  
  // Separate state for different search input types
  const [searchString, setSearchString] = useState('');
  const [searchValues, setSearchValues] = useState([]);

  const fetchSeasons = useCallback(async () => {
    setLoading(true);
    let valueForApi;
    if (searchType === 'requireAttention') {
      // Use the department names directly for the API call
      valueForApi = searchValues.join(',');
    } else {
      valueForApi = searchString;
    }


    try {
      const params = {
        searchType,
        searchValue: valueForApi,
        page: page + 1,
        limit: rowsPerPage,
        sortBy: sortField,
        sortOrder: sortOrder,
      };
      const response = await seasonService.getAllSeasons(params);
      setSeasons(response.seasons || []);
      setTotalSeasons(response.totalSeasons || 0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred while fetching seasons.');
    } finally {
      setLoading(false);
    }
  }, [searchType, searchString, searchValues, page, rowsPerPage, sortField, sortOrder, departments]);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons, location.state?.refresh]);

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [buyersData, deptsData] = await Promise.all([
          buyerService.getAllBuyers(),
          departmentService.getAllDepartments()
        ]);
        setBuyers(buyersData || []);
        setDepartments(deptsData || []);
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
        setError('Could not load filter options.');
      }
    };
    fetchFilterData();
  }, []);

  const handleSearchTypeChange = (event) => {
    setSearchType(event.target.value);
    // Reset search values when type changes
    setSearchString('');
    setSearchValues([]);
    setPage(0);
  };

  const handleSearchStringChange = (event) => {
    setSearchString(event.target.value);
    setPage(0);
  };

  const handleSearchValuesChange = (event) => {
    const { target: { value } } = event;
    // The `value` from the event is the new array of selected values.
    setSearchValues(value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSortRequest = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const renderSearchValueInput = () => {
    switch (searchType) {
      case 'seasonName':
        return (
          <FormControl  sx={{ minWidth: 280 }}>
            <TextField label="Season Name" variant="outlined" fullWidth value={searchString} onChange={handleSearchStringChange} />
          </FormControl>
        );
      case 'status':
        return (
          <FormControl  sx={{ minWidth: 280 }}>
            <InputLabel>Status</InputLabel>
            <Select value={searchString} label="Status" onChange={handleSearchStringChange}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="Open">Open</MenuItem>
              <MenuItem value="On-Hold">On-Hold</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
              <MenuItem value="Canceled">Canceled</MenuItem>
            </Select>
          </FormControl>
        );
      case 'buyer':
        return (
          <FormControl sx={{ minWidth: 280 }}>
            <InputLabel>Buyer</InputLabel>
            <Select value={searchString} label="Buyer" onChange={handleSearchStringChange}>
              <MenuItem value="all">All</MenuItem>
              {buyers.map((buyer) => (
                <MenuItem key={buyer._id} value={buyer._id}>{buyer.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'requireAttention':
        return (
          <FormControl sx={{ minWidth: 280 }}>
            <InputLabel id="needs-attention-label">Needs Attention</InputLabel>
            <Select
              labelId="needs-attention-label"
              id="needs-attention-select"
              multiple
              value={searchValues}
              onChange={handleSearchValuesChange}
              input={<OutlinedInput id="select-multiple-chip" label="Needs Attention" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {departments.map((dept) => (
                <MenuItem key={dept._id} value={dept.name}>
                  <Checkbox checked={searchValues.indexOf(dept.name) > -1} />
                  <ListItemText primary={dept.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      default: return <TextField fullWidth disabled />;
    }
  };

  return (
    <Paper sx={{ padding: 2, margin: 2 ,maxWidth:'80%',margin:'auto'}}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom></Typography>
        <Button variant="contained" component={RouterLink} to="/seasons/new">Create New Season</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 ,justifyContent:'flex-end'}}>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Search By</InputLabel>
          <Select value={searchType} label="Search By" onChange={handleSearchTypeChange}>
            <MenuItem value="seasonName">Season Name</MenuItem>
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="buyer">Buyer</MenuItem>
            <MenuItem value="requireAttention">Need Attention</MenuItem>
          </Select>
        </FormControl>
        {renderSearchValueInput()}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table aria-label="seasons table">
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell key={headCell.id} sortDirection={sortField === headCell.id ? sortOrder : false}>
                  {headCell.sortable ? (
                    <TableSortLabel active={sortField === headCell.id} direction={sortField === headCell.id ? sortOrder : 'asc'} onClick={() => handleSortRequest(headCell.id)}>
                      {headCell.label}
                    </TableSortLabel>
                  ) : headCell.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={headCells.length} align="center"><CircularProgress /></TableCell></TableRow>
            ) : seasons.length > 0 ? (
              seasons.map((season) => (
                <TableRow hover key={season._id}>
                  <TableCell><Link component={RouterLink} to={`/seasons/${season._id}`}>{season.name}</Link></TableCell>
                  <TableCell>{season.buyer?.name || 'N/A'}</TableCell>
                  <TableCell><Chip label={season.status} color={getStatusChipColor(season.status)} onClick={()=>{}} size="small" /></TableCell>
                  <TableCell>{season.createdAt ? format(new Date(season.createdAt), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                  <TableCell>
                    {season.requireAttention && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WarningAmberIcon color="error" sx={{ mr: 0.5 }} />
                        {Array.isArray(season.requireAttention) ? season.requireAttention.join(', ') : season.requireAttention}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={headCells.length} align="center"><Typography>No seasons found.</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalSeasons}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default DashboardPage;
