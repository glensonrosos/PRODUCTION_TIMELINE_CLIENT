import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useContext } from 'react';
import moment from 'moment';
import { Box, Typography, Paper, CircularProgress, Alert, Chip, IconButton, Button, Menu, MenuItem, Divider, ListItemIcon, ListItemText, Card, CardContent, Grid, Backdrop, FormControl, InputLabel, Select } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import { DataGrid, GridRowModes, GridActionsCellItem } from '@mui/x-data-grid';
import LockIcon from '@mui/icons-material/Lock';
import AttachmentIcon from '@mui/icons-material/Attachment';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import seasonService from '../services/seasonService';
import { useAuth } from '../contexts/AuthContext';
import ActivityLogViewer from '../components/logs/ActivityLogViewer';
import HistoryIcon from '@mui/icons-material/History';
import EditSeasonModal from '../components/seasons/EditSeasonModal';
import RemarksCell from '../components/seasons/RemarksCell';

// Helper function to calculate the reference timeline based on dependencies
const calculateReferenceTimeline = (tasks, seasonCreationDate) => {
  if (!tasks || tasks.length === 0) return new Map();

  const timeline = new Map();
  const tasksByOrder = new Map(tasks.map(task => [task.order, task]));

  // Sort tasks to process dependencies in a more orderly fashion
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.order.length < b.order.length) return -1;
    if (a.order.length > b.order.length) return 1;
    return a.order.localeCompare(b.order);
  });

  // Iteratively calculate dates until all tasks have a timeline
  let tasksToProcess = sortedTasks.length;
  let iterations = 0;
  const MAX_ITERATIONS = tasksToProcess + 5; // Failsafe for circular dependencies

  while (tasksToProcess > 0 && iterations < MAX_ITERATIONS) {
    let processedInThisIteration = 0;
    sortedTasks.forEach(task => {
      // If already calculated, skip
      if (timeline.has(task._id)) return;

      let canCalculate = true;
      let maxPrecedingEndDate = moment(seasonCreationDate);

      if (task.precedingTasks && task.precedingTasks.length > 0) {
        for (const precedingOrder of task.precedingTasks) {
          const precedingTask = tasksByOrder.get(precedingOrder);
          if (precedingTask && timeline.has(precedingTask._id)) {
            const precedingEndDate = timeline.get(precedingTask._id).end;
            if (moment(precedingEndDate).isAfter(maxPrecedingEndDate)) {
              maxPrecedingEndDate = moment(precedingEndDate);
            }
          } else {
            // A dependency hasn't been calculated yet, so we can't proceed with this task
            canCalculate = false;
            break;
          }
        }
      }

      if (canCalculate) {
        const startDate = maxPrecedingEndDate;
        const endDate = moment(startDate).add(task.leadTime, 'days');
        timeline.set(task._id, { start: startDate.toDate(), end: endDate.toDate() });
        processedInThisIteration++;
      }
    });

    tasksToProcess -= processedInThisIteration;
    iterations++;
    if (processedInThisIteration === 0 && tasksToProcess > 0) {
        console.error("Could not resolve all task dependencies for reference timeline. Check for circular dependencies.");
        break; // Break loop if no progress is made
    }
  }

  return timeline;
};

const SeasonDetailPage = () => {
  const { user: currentUser, loading: authLoading, isAuthenticated } = useAuth();
  

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { seasonId } = useParams();
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [taskList, setTaskList] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState('');
  const [rowModesModel, setRowModesModel] = useState({});
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });
  const [logViewerOpen, setLogViewerOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [referenceTimeline, setReferenceTimeline] = useState(new Map());

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'primary';
      case 'Closed':
        return 'success';
      case 'On-Hold':
        return 'warning';
      case 'Canceled':
        return 'error';
      default:
        return 'default';
    }
  };

  useEffect(() => {
    if (seasonDetails) {
      setSelectedStatus(seasonDetails.status);
    }
  }, [seasonDetails]);

  const handleStatusUpdate = async () => {
    if (!seasonId || !selectedStatus || selectedStatus === seasonDetails.status) return;

    setIsUpdating(true);
    try {
      const updatedSeason = await seasonService.updateSeasonStatus(seasonId, selectedStatus);
      setSeasonDetails(updatedSeason); // Update the local state with the response
      setAlertInfo({ open: true, message: 'Season status updated successfully!', severity: 'success' });
    } catch (err) {
      console.error('Failed to update season status:', err);
      setError(err.message || 'Failed to update season status.');
      setAlertInfo({ open: true, message: err.message || 'Failed to update season status.', severity: 'error' });
      // Revert dropdown to original status on failure
      setSelectedStatus(seasonDetails.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await seasonService.exportSeasonToExcel(seasonId);
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from content-disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `season_${seasonId}_export.xlsx`; // Default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      
      // Append to html, click, and remove
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url); // Clean up

    } catch (err) {
      console.error('Failed to export season:', err);
      setAlertInfo({ open: true, message: 'Failed to export season data.', severity: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveSeasonDetails = async (updatedData) => {
    setIsUpdating(true);
    try {
      const updatedSeason = await seasonService.updateSeasonDetails(seasonId, updatedData);
      setSeasonDetails(updatedSeason);
      setEditModalOpen(false);
      setAlertInfo({ open: true, message: 'Season details updated successfully!', severity: 'success' });
    } catch (err) {
      console.error('Failed to update season details:', err);
      setAlertInfo({ open: true, message: err.message || 'Failed to update season details.', severity: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchSeasonDetails = useCallback(async () => {
    setLoading(true);
    try {
      const data = await seasonService.getSeasonById(seasonId);
      
      const sortedTasks = data.tasks || [];

      // Custom sort for Excel-style order codes (A, B, ..., Z, AA, AB, ...)
      sortedTasks.sort((a, b) => {
        const orderA = a.order;
        const orderB = b.order;
        if (orderA.length < orderB.length) return -1;
        if (orderA.length > orderB.length) return 1;
        return orderA.localeCompare(orderB);
      });

      setSeasonDetails(data.season);
      setTaskList(sortedTasks);
      setError('');
    } catch (err) {
      console.error('Error fetching season details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch season details.');
      setSeasonDetails(null);
      setTaskList([]);
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    if (seasonId) {
      fetchSeasonDetails();
    }
  }, [fetchSeasonDetails, seasonId]);

  useEffect(() => {
    if (taskList.length > 0 && seasonDetails?.createdAt) {
      const timeline = calculateReferenceTimeline(taskList, seasonDetails.createdAt);
      setReferenceTimeline(timeline);
    }
  }, [taskList, seasonDetails?.createdAt]);

  // Helper functions and sub-components moved before 'columns'

  const isTaskActionable = useCallback((task, allTasks) => {
    if (!task || task.status === 'completed' || task.status === 'blocked') {
      return false;
    }
    if (!task.precedingTasks || task.precedingTasks.length === 0) {
      return true; // No preceding tasks, so it's actionable if pending
    }
    // Ensure allTasks is available and is an array
    if (!allTasks || !Array.isArray(allTasks)) {
        // console.warn('[isTaskActionable] allTasks is not available or not an array');
        return false; 
    }
    return task.precedingTasks.every(precedingTaskOrder => {
      const precedingTask = allTasks.find(t => t.order === precedingTaskOrder);
      return precedingTask && precedingTask.status === 'completed';
    });
  }, []); // Keep deps array minimal if allTasks is always passed fresh

  const getRowClassName = (params) => {
    const task = params.row;
    if (!task) return '';
    if (task.status === 'completed') return 'row-completed';
    if (task.status === 'blocked') return 'row-blocked';
    // isTaskActionable is now defined before getRowClassName, taskList is from component state
    if (isTaskActionable(task, taskList)) return 'row-actionable'; 
    if (task.status === 'pending') return 'row-pending';
    return '';
  };

  const handleEditClick = useCallback((id, task) => {
    console.log('%c[handleEditClick] CALLED', 'color: blue; font-weight: bold;', 'Task ID:', id, 'Task Status:', task?.status, 'User Role:', currentUser?.role);
    const userRole = currentUser?.role?.toLowerCase();
    const isAdminOrPlanner = userRole === 'admin' || userRole === 'planner';

    if (!task) {
      console.log('[handleEditClick] No task data. Aborting.');
      setAlertInfo({ open: true, message: 'Task data not found.', severity: 'error' });
      return;
    }

    const taskStatusLower = task.status ? task.status.toLowerCase() : null;
    if (taskStatusLower === 'completed' && !isAdminOrPlanner) {
      console.log('%c[handleEditClick] PREVENTING EDIT: Task is completed and user is not Admin/Planner.', 'color: red; font-weight: bold;');
      setAlertInfo({ open: true, message: 'Completed tasks can only be modified by Admin or Planner roles.', severity: 'warning' });
      return;
    }
    if (taskStatusLower === 'blocked') {
      console.log('%c[handleEditClick] PREVENTING EDIT: Task is blocked.', 'color: red; font-weight: bold;');
      setAlertInfo({ open: true, message: 'Blocked tasks cannot be edited.', severity: 'warning' });
      return;
    }
    if (taskStatusLower === 'pending' && taskList) {
      const tasksMap = new Map(taskList.map(t => [t.order, t]));
      let predecessorsDone = true;
      if (task.precedingTasks && task.precedingTasks.length > 0) {
        for (const predOrder of task.precedingTasks) {
          const predecessor = tasksMap.get(predOrder);
          if (predecessor && predecessor.status !== 'completed') {
            predecessorsDone = false;
            break;
          }
        }
      }
      if (!predecessorsDone) {
        console.log('%c[handleEditClick] PREVENTING EDIT: Preceding tasks not complete.', 'color: red; font-weight: bold;');
        setAlertInfo({ open: true, message: 'This task is not yet actionable as preceding tasks are not complete.', severity: 'warning' });
        return;
      }
    } else if (taskStatusLower === 'pending' && (!taskList)) {
      console.log('%c[handleEditClick] PREVENTING EDIT: Task list unavailable for pending task.', 'color: red; font-weight: bold;');
      setAlertInfo({ open: true, message: 'Cannot determine task actionability: task list unavailable.', severity: 'error' });
      return;
    }
    if (!isAdminOrPlanner && task.responsible && !task.responsible.includes(currentUser?.department)) {
      console.log('%c[handleEditClick] PREVENTING EDIT: User department not responsible.', 'color: red; font-weight: bold;');
      setAlertInfo({ open: true, message: 'Your department is not allowed to edit this task.', severity: 'warning' });
      return;
    }
    console.log('%c[handleEditClick] ALLOWING EDIT MODE to be set.', 'color: darkgreen; font-weight: bold;');
    setAlertInfo({ open: false, message: '', severity: 'info' });
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: 'actualCompletion' },
    }));
  }, [currentUser, taskList]);

  const handleRowEditStop = (params, event) => {
    event.defaultMuiPrevented = true;
  };

  const handleCellDoubleClick = useCallback((params, event) => {
    // params.field, params.row, params.id are available
    // event is the MuiGridCellEditStartReasons object or similar
    console.log('%c[handleCellDoubleClick] CALLED', 'color: blueviolet; font-weight: bold;', 'Field:', params.field, 'Task Status:', params.row?.status, 'User Role:', currentUser?.role);
    const targetFields = ['actualCompletion', 'remarks'];
    if (!targetFields.includes(params.field)) {
      return; // Not a field we're interested in for this specific restriction
    }
    const userRole = currentUser?.role?.toLowerCase();
    const isAdminOrPlanner = userRole === 'admin' || userRole === 'planner';
    const taskStatusLower = params.row?.status ? params.row.status.toLowerCase() : null;

    if (taskStatusLower === 'completed' && !isAdminOrPlanner) {
      console.log('%c[handleCellDoubleClick] PREVENTING EDIT: Task is completed and user is not Admin/Planner.', 'color: red; font-weight: bold;');
      setAlertInfo({
        open: true,
        message: 'Completed tasks can only be modified by Admin or Planner roles.', // Unified message
        severity: 'warning',
      });
      // Prevent the DataGrid from entering edit mode for this cell
      event.defaultMuiPrevented = true; 
      return;
    }
    console.log('%c[handleCellDoubleClick] ALLOWING default double-click behavior.', 'color: green;');
  }, [currentUser, setAlertInfo]);

  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const handleProcessRowUpdate = useCallback(async (newRow, oldRow) => {
    const apiPayload = {};

    if (newRow.remarks !== oldRow.remarks) {
      apiPayload.remarks = newRow.remarks;
    }

    const oldCompletion = oldRow.actualCompletion ? moment(oldRow.actualCompletion).toISOString() : null;
    const newCompletion = newRow.actualCompletion ? moment(newRow.actualCompletion).toISOString() : null;
    
    if (newCompletion !== oldCompletion) {
      if (newCompletion && newRow.computedDates?.start && moment(newCompletion).isBefore(moment(newRow.computedDates.start), 'day')) {
        setAlertInfo({
          open: true,
          message: 'Actual completion date cannot be earlier than the start date.',
          severity: 'error',
        });
        return Promise.reject(new Error('Invalid date'));
      }
      apiPayload.actualCompletion = newCompletion;
    }

    if (apiPayload.actualCompletion && newRow.status !== 'completed') {
      apiPayload.status = 'completed';
    }

    if (Object.keys(apiPayload).length === 0) {
      return oldRow;
    }

    setIsUpdating(true);

    try {
      const response = await seasonService.updateTaskInSeason(seasonId, newRow._id, apiPayload);

      if (response && response.season && response.tasks) {
        console.log('Successfully updated task. Updating UI with new season and task data.');
        // Ensure tasks are sorted correctly after update
        const sortedTasks = response.tasks.sort((a, b) => {
          const orderA = a.order;
          const orderB = b.order;
          if (orderA.length < orderB.length) return -1;
          if (orderA.length > orderB.length) return 1;
          return orderA.localeCompare(orderB);
        });

        setSeasonDetails(response.season);
        setTaskList(sortedTasks);
        setAlertInfo({ open: true, message: response.message || 'Task updated successfully!', severity: 'success' });
        const updatedTask = response.tasks.find(task => task._id === newRow._id);
        return updatedTask || newRow;
      } else {
        console.error('[SeasonDetailPage] Invalid response structure from updateTaskInSeason:', response);
        throw new Error('Received an invalid response from the server after update.');
      }
    } catch (err) {
      console.error('[handleProcessRowUpdate] API call failed. Full error object:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'An unknown error occurred during task update.';
      setAlertInfo({ open: true, message: errorMessage, severity: 'error' });
      return Promise.reject(new Error(errorMessage));
    } finally {
      setIsUpdating(false);
    }
  }, [seasonId, setAlertInfo, setTaskList, setIsUpdating]);

  const handleProcessRowUpdateError = useCallback((error) => {
    // The 'error' here is what was rejected from processRowUpdate
    console.error("[SeasonDetailPage] Unhandled error in DataGrid's processRowUpdate. Error message:", error.message);
    // The alert was likely already set in handleProcessRowUpdate, but we can set a generic one here as a fallback.
    setAlertInfo((prev) => ({
      ...prev,
      open: true,
      // Avoid overwriting a more specific message if it was already set
      message: prev.message && prev.open ? prev.message : 'An unexpected error occurred while saving the task.',
      severity: 'error',
    }));
  }, [setAlertInfo]);

  const isCellEditable = useCallback((params) => {
    if (authLoading || !currentUser || !seasonDetails) {
      return false;
    }

    if (seasonDetails?.status !== 'Open') {
      return false;
    }

    const userRole = currentUser?.role.toLowerCase();
    const isAdminOrPlanner = userRole === 'admin' || userRole === 'planner';
    const taskStatusLower = params.row?.status ? params.row.status.toLowerCase() : null;

    if (taskStatusLower === 'completed' && !isAdminOrPlanner) {
      return false;
    }

    // Check if user's department is in the responsible list
    const responsibleDepartments = params.row.responsible.map(d => d.toLowerCase());
    const userDepartment = currentUser?.department?.name.toLowerCase();

    // A cell is editable if the user is an admin/planner OR their department is responsible for the task.
    return isAdminOrPlanner || responsibleDepartments.includes(userDepartment);
  }, [currentUser, seasonDetails, authLoading]);

  const handleRemarkUpdate = async (row, newRemarks) => {
    const apiPayload = { remarks: newRemarks };
    setIsUpdating(true);
    try {
      const response = await seasonService.updateTaskInSeason(seasonId, row._id, apiPayload);
      if (response && response.tasks) {
        const sortedTasks = response.tasks.sort((a, b) => {
          const orderA = a.order;
          const orderB = b.order;
          if (orderA.length < orderB.length) return -1;
          if (orderA.length > orderB.length) return 1;
          return orderA.localeCompare(orderB);
        });
        setTaskList(sortedTasks);
        setAlertInfo({ open: true, message: 'Remarks updated successfully!', severity: 'success' });
      } else {
        throw new Error('Invalid response from server when updating remarks.');
      }
    } catch (err) {
      console.error('Failed to update remarks:', err);
      setAlertInfo({ open: true, message: err.message || 'Failed to update remarks.', severity: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const AttachmentCell = ({ params, seasonId, onUploadSuccess }) => {
    const fileInputRef = useRef(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    if (!params || !params.row) {
      return null;
    }

    const { row } = params;
    const attachments = row?.attachments || [];

    const handleMenuClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    const handleDownloadClick = async (attachmentId, filename) => {
      handleMenuClose();
      try {
        const { data } = await seasonService.downloadAttachmentForTask(seasonId, row._id, attachmentId);
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Download failed:', err);
        setAlertInfo({ open: true, message: 'Failed to download attachment.', severity: 'error' });
      }
    };

    const handleDeleteClick = async (attachmentId) => {
      handleMenuClose();
      if (window.confirm('Are you sure you want to delete this attachment?')) {
        try {
          await seasonService.deleteAttachmentForTask(seasonId, row._id, attachmentId);
          setAlertInfo({ open: true, message: 'Attachment deleted successfully.', severity: 'success' });
          onUploadSuccess();
        } catch (err) {
          console.error('Delete failed:', err);
          setAlertInfo({ open: true, message: 'Failed to delete attachment.', severity: 'error' });
        }
      }
    };

    const handleFileChange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('attachment', file);
      try {
        await seasonService.uploadAttachmentForTask(seasonId, row._id, formData);
        setAlertInfo({ open: true, message: 'Attachment uploaded successfully.', severity: 'success' });
        onUploadSuccess();
      } catch (err) {
        console.error('Upload failed:', err);
        setAlertInfo({ open: true, message: 'Failed to upload attachment.', severity: 'error' });
      }
    };

    const handleUploadClick = () => {
      fileInputRef.current.click();
    };
    
    const handleUploadAndCloseMenu = () => {
      handleMenuClose();
      handleUploadClick();
    };

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        {attachments.length === 0 ? (
          <IconButton onClick={handleUploadClick} title="Upload Attachment">
            <UploadFileIcon />
          </IconButton>
        ) : (
          <>
            <IconButton onClick={handleMenuClick} title={`${attachments.length} attachment(s)`}>
              <AttachmentIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
            >
              {attachments.map((att) => (
                <MenuItem key={att._id} dense>
                  <ListItemText primary={att.filename} sx={{ mr: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} />
                  <IconButton size="small" onClick={() => handleDownloadClick(att._id, att.filename)} title="Download">
                    <FileDownloadIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteClick(att._id)} title="Delete">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </MenuItem>
              ))}
              <Divider />
              <MenuItem onClick={handleUploadAndCloseMenu}>
                <ListItemIcon>
                  <UploadFileIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Upload New</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>
    );
  };

  const columns = useMemo(
    () => [
      {
        field: 'order',
        headerName: 'Order',
        width: 70,
        editable: false,
        cellClassName: 'font-tabular-nums',
      },
      {
        field: 'name',
        headerName: 'Task Name',
        flex: 2,
        minWidth: 250,
        editable: false,
      },
      
      {
        field: 'responsible',
        headerName: 'Responsible',
        flex: 1,
        minWidth: 150,
        editable: false,
        valueGetter: (value, row) => row.responsible.join(', '),
      },
      {
        field: 'precedingTasks',
        headerName: 'Preceding Tasks',
        flex: 1,
        minWidth: 100,
        editable: false,
        valueGetter: (value, row) => row.precedingTasks.join(', '),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        editable: false,
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            color={
              params.value === 'completed'
                ? 'success'
                : params.value === 'pending' && isTaskActionable(params.row, taskList)
                ? 'warning'
                : params.value === 'blocked'
                ? 'error'
                : 'default'
            }
            variant={
              isTaskActionable(params.row, taskList) || params.value === 'completed'
                ? 'filled'
                : 'outlined'
            }
          />
        ),
      },
      {
        field: 'timelineReference',
        headerName: 'Timeline Reference',
        width: 200,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const timelineInfo = referenceTimeline.get(params.row._id);
          if (!timelineInfo || !timelineInfo.start || !timelineInfo.end) {
            return '...';
          }
          const start = moment(timelineInfo.start).format('DD-MMM-YY');
          const end = moment(timelineInfo.end).format('DD-MMM-YY');
          return `${start} - ${end}`;
        },
        headerClassName: 'header-static',
      },
      {
        field: 'leadTime',
        headerName: 'Lead Time (days)',
        type: 'number',
        width: 70,
        editable: false,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (value, row) => row.leadTime,
        cellClassName: 'font-tabular-nums',
      },
      {
        field: 'computedDates.start',
        headerName: 'Start Date',
        type: 'date',
        width: 120,
        editable: false,
        valueGetter: (value, row) =>
          row.computedDates?.start ? new Date(row.computedDates.start) : null,
        valueFormatter: (value) => (value ? moment(value).format('DD-MMM-YY') : ''),
        cellClassName: 'font-tabular-nums',
      },
      {
        field: 'computedDates.end',
        headerName: 'End Date',
        type: 'date',
        width: 120,
        editable: false,
        valueGetter: (value, row) =>
          row.computedDates?.end ? new Date(row.computedDates.end) : null,
        valueFormatter: (value) => (value ? moment(value).format('DD-MMM-YY') : ''),
        cellClassName: 'font-tabular-nums',
      },
      {
        field: 'actualCompletion',
        headerName: 'Actual Completion',
        type: 'date',
        width: 180,
        headerClassName: 'header-editable',
        editable: (params) => isCellEditable(params),
        valueGetter: (value, row) =>
          row.actualCompletion ? new Date(row.actualCompletion) : null,
        valueFormatter: (value) => (value ? moment(value).format('DD-MMM-YY') : ''),
        valueParser: (value) => (value ? moment(value, 'DD-MMM-YY').toDate() : null),
        cellClassName: 'font-tabular-nums cell-editable',
      },
      {
        field: 'dateSpend',
        headerName: 'Date Spend',
        width: 70,
        editable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const { row } = params;
          if (!row || !row.actualCompletion || !row.computedDates?.end) {
            return '';
          }

          const actual = moment(row.actualCompletion).startOf('day');
          const plannedEnd = moment(row.computedDates.end).startOf('day');
          const diff = actual.diff(plannedEnd, 'days');

          const text = diff > 0 ? `+${diff}d` : `${diff}d`;
          const color =
            diff > 0 ? 'error.main' : diff < 0 ? 'success.main' : 'text.secondary';

          return (
            <Typography variant="body2" color={color} sx={{ fontWeight: 'bold', pt: 2 }}>
              {text}
            </Typography>
          );
        },
      },
      {
        headerName: 'Remarks',
        field: 'remarks',
        flex: 2,
        minWidth: 150,
        sortable: false,
        editable: false, // Editing is handled by the custom cell
        renderCell: (params) => {
          const editable = isCellEditable(params);
          return <RemarksCell params={params} isEditable={editable} onSave={handleRemarkUpdate} />;
        },
        cellClassName: 'cell-editable',
      },
      {
        field: 'attachments',
        headerName: 'Attachments',
        headerClassName: 'header-editable',
        width: 150,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <AttachmentCell
            params={params}
            seasonId={seasonId}
            onUploadSuccess={fetchSeasonDetails}
          />
        ),
        cellClassName: 'cell-editable',
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 100,
        cellClassName: 'actions',
        getActions: (params) => {
            const isInEditMode = rowModesModel[params.id]?.mode === GridRowModes.Edit;
            if (isInEditMode) {
              return [
                <GridActionsCellItem
                  icon={<SaveIcon />}
                  label="Save"
                  sx={{ color: 'primary.main' }}
                  onClick={handleSaveClick(params.id)}
                />,
                <GridActionsCellItem
                  icon={<CancelIcon />}
                  label="Cancel"
                  className="textPrimary"
                  onClick={handleCancelClick(params.id)}
                  color="inherit"
                />,
              ];
            }
            return [
              <GridActionsCellItem
                icon={<EditIcon />}
                label="Edit"
                className="textPrimary"
                onClick={() => handleEditClick(params.id, params.row)}
                color="inherit"
                disabled={!isCellEditable(params)}
              />,
            ];
          },
      },
    ],
    [
      rowModesModel,
      currentUser,
      taskList,
      seasonId,
      fetchSeasonDetails,
      isCellEditable,
      handleRemarkUpdate,
      isTaskActionable,
      handleSaveClick, 
      handleCancelClick, 
      handleEditClick
    ]
  );

  // Optional: Redirect if not authenticated, though AuthProvider might handle this
  // if (!isAuthenticated && !authLoading) { // authLoading is false here
  //   // return <Navigate to="/login" replace />;
  //   // console.warn("[SeasonDetailPage] User not authenticated after auth loading finished.");
  // }

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isUpdating}
      >
        <CircularProgress color="inherit" />
        <Typography sx={{ ml: 2 }}>Updating Task...</Typography>
      </Backdrop>
      <Paper sx={{ p: 3, m: 2, position: 'relative' }}>
        {alertInfo.open && (
          <Alert 
            severity={alertInfo.severity} 
            onClose={() => setAlertInfo({ ...alertInfo, open: false })} 
            sx={{ position: 'absolute', top: 150, left: '50%', transform: 'translateX(-50%)', zIndex: 1201, minWidth: '300px' }}
          >
            {alertInfo.message}
          </Alert>
        )}

        {loading && <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%' }} />}
        {error && <Alert severity="error">{error}</Alert>}
        
        <Box sx={{ opacity: loading ? 0.3 : 1 }}>
        <Card sx={{
  mb: 3,
  p: 0,
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
  borderRadius: '12px',
  background: (theme) => theme.palette.background.paper,
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.12)'
  }
}}>
  <CardContent sx={{ 
    p: 3, 
    '&:last-child': { pb: 3 },
    position: 'relative',
    '&:before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '4px',
      background: (theme) => theme.palette.primary.main,
      borderRadius: '12px 0 0 12px'
    }
  }}>
    <Grid container spacing={3} justifyContent="space-between" alignItems="flex-start">
      {/* Left Section */}
      <Grid item xs={12} md={8}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          position: 'relative'
        }}>
          {/* Title with edit button */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            flexWrap: 'wrap'
          }}>
            <Typography variant="h5" component="div" sx={{ 
              fontWeight: 700, 
              color: (theme) => theme.palette.text.primary,
              letterSpacing: '-0.25px'
            }}>
              {seasonDetails?.name || 'Season Details'}
            </Typography>
            
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Planner') && (
              <IconButton 
                onClick={() => setEditModalOpen(true)} 
                size="small" 
                title="Edit Season Details"
                sx={{
                  backgroundColor: (theme) => theme.palette.primary.light,
                  '&:hover': {
                    backgroundColor: (theme) => theme.palette.primary.main,
                    color: '#fff'
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          
          {/* Buyer info with interactive chip */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            flexWrap: 'wrap'
          }}>
            <Typography variant="body2" sx={{ 
              color: 'text.secondary',
              fontWeight: 500
            }}>
              Buyer:
            </Typography>
            <Chip 
              label={seasonDetails?.buyer?.name || 'N/A'} 
              onClick={() => {}} 
              color="primary" 
              size="medium" 
              sx={{ 
                fontWeight: 600,
                px: 1.5,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                }
              }} 
            />
          </Box>
          
          {/* Additional details section */}
          {seasonDetails?.description && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ 
                color: 'text.secondary',
                lineHeight: 1.6
              }}>
                {seasonDetails.description}
              </Typography>
            </Box>
          )}
        </Box>
      </Grid>

      {/* Right Section */}
      <Grid item xs={12} md={4}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: { xs: 'flex-start', md: 'flex-end' }, 
          gap: 2,
          height: '100%'
        }}>
          {/* Status with animated chip */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5
          }}>
            <Typography variant="body2" sx={{ 
              color: 'text.secondary',
              fontWeight: 500
            }}>
              Status:
            </Typography>
            <Chip
              label={seasonDetails?.status || 'Unknown'}
              color={getStatusColor(seasonDetails?.status)}
              sx={{ 
                fontWeight: 700, 
                minWidth: 100, 
                justifyContent: 'center',
                fontSize: '0.875rem',
                py: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
              onClick={() => {}}
            />
          </Box>
          
          {/* Requires attention section */}
          {seasonDetails?.requireAttention && seasonDetails.requireAttention.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              gap: 1,
              width: '100%'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1
              }}>
                <WarningIcon fontSize="small" color="error" />
                <Typography variant="body2" sx={{ 
                  color: 'error.main', 
                  fontWeight: 600 
                }}>
                  Requires Attention:
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1,
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                maxWidth: '100%'
              }}>
                {seasonDetails.requireAttention.map(dep => (
                  <Chip 
                    key={dep} 
                    onClick={() => {}} 
                    label={dep} 
                    size="small" 
                    color="error" 
                    variant="outlined"
                    sx={{
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.error.light,
                        color: (theme) => theme.palette.error.dark
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Grid>
    </Grid>
  </CardContent>
</Card>
            {/* Action Buttons */}
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
    mb: 2
  }}>
    <Button
      variant="outlined"
      startIcon={<HistoryIcon />}
      onClick={() => setLogViewerOpen(true)}
      sx={{
        px: 2,
        py: 1,
        borderRadius: 1,
        borderWidth: 1,
        '&:hover': { borderWidth: 1 }
      }}
    >
      View Activity Logs
    </Button>
    
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      flexWrap: 'wrap'
    }}>
      {(currentUser?.role === 'Admin' || currentUser?.role === 'Planner') && seasonDetails && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          backgroundColor: (theme) => theme.palette.action.hover,
          p: 1,
          borderRadius: 1
        }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="status-select-label">Update Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={selectedStatus}
              label="Update Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ 
                backgroundColor: 'background.paper',
                borderRadius: 1
              }}
            >
              <MenuItem value="Open">Open</MenuItem>
              <MenuItem value="On-Hold">On-Hold</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
              <MenuItem value="Canceled">Canceled</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleStatusUpdate}
            disabled={isUpdating || selectedStatus === seasonDetails.status}
            sx={{
              px: 3,
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' }
            }}
          >
            {isUpdating ? <CircularProgress size={20} /> : 'Update Status'}
          </Button>
        </Box>
      )}
      
      <Button
        variant="contained"
        startIcon={<GetAppIcon />}
        onClick={handleExport}
        disabled={isExporting}
        sx={{
          px: 3,
          backgroundColor: (theme) => theme.palette.success.main,
          '&:hover': {
            backgroundColor: (theme) => theme.palette.success.dark
          },
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' }
        }}
      >
        {isExporting ? <CircularProgress size={20} /> : 'Export Data'}
      </Button>
    </Box>
  </Box>
          <Box sx={{ height: 'calc(100vh - 250px)', width: '100%' }}>
            <DataGrid
              rows={taskList}
              columns={columns}
              getRowId={(row) => row._id}
              getRowClassName={getRowClassName}
              columnBuffer={8} 
              columnThreshold={8} 
              editMode="row"
              rowModesModel={rowModesModel}
              onRowModesModelChange={handleRowModesModelChange}
              onRowEditStop={handleRowEditStop}
              onCellDoubleClick={handleCellDoubleClick}
              processRowUpdate={handleProcessRowUpdate}
              onProcessRowUpdateError={handleProcessRowUpdateError}
              initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              slotProps={{}}
              sx={{
                '& .row-completed': {
                  backgroundColor: 'rgba(102, 187, 106, 0.2) !important',
                  '&:hover': {
                    backgroundColor: 'rgba(102, 187, 106, 0.4) !important',
                  },
                },
                '& .row-actionable': {
                  backgroundColor: 'rgba(255, 167, 38, 0.2) !important',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 167, 38, 0.4) !important',
                  },
                },
                '& .row-pending': {
                  backgroundColor: 'rgb(245, 243, 241) !important',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.69) !important',
                  },
                },
                '@keyframes pulse': {
                  '0%': { backgroundColor: 'rgba(255, 229, 102, 0.4)', boxShadow: '0 0 0 0 rgba(255, 229, 102, 0.6)' },
                  '70%': { boxShadow: '0 0 0 10px rgba(255, 229, 102, 0)' },
                  '100%': { backgroundColor: 'rgba(255, 229, 102, 0.4)', boxShadow: '0 0 0 0 rgba(255, 229, 102, 0)' },
                },
                '& .header-editable': {
                  backgroundColor: 'rgba(227, 242, 253, 0.9)',
                  fontWeight: 'bold',
                },
                '& .task-row-current-blocker': { animation: 'pulse 2s infinite' },
                '& .task-row-completed': {
                  backgroundColor: 'rgba(200, 230, 200, 0.7) !important', // Light green
                  '& .MuiDataGrid-cell': {
                    color: 'rgba(0, 0, 0, 0.6)',
                  }
                },
                '& .task-row-actionable': {
                  backgroundColor: 'rgba(255, 196, 129, 0.3) !important', // Light orange
                },
                '& .task-row-blocked': {
                  backgroundColor: 'rgba(255, 200, 200, 0.7) !important', // Light red
                },
                '& .task-name-actionable': { // Applied to name cell if task is actionable
                  fontWeight: 'bold',
                },
                '& .cell-editable': {
                  backgroundColor: 'rgba(227, 242, 253, 0.7)',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(200, 230, 253, 0.9)' },
                },
                '& .status-cell-actionable': { // Status cell within an actionable (orange) row
                  fontWeight: 'bold', 
                  color: '#b26400', // Darker orange text to stand out on light orange bg
                },
                '& .status-cell-completed': { // Status cell within a completed (green) row
                  color: 'darkgreen', 
                  fontWeight: 'bold',
                },
                '& .status-cell-blocked': { // Status cell within a blocked (red) row
                  color: 'darkred', 
                  fontWeight: 'bold', 
                },
              }}
            />
          </Box>
        </Box>
      </Paper>
      <ActivityLogViewer
        open={logViewerOpen}
        onClose={() => setLogViewerOpen(false)}
        seasonId={seasonId}
      />
      {seasonDetails && (
        <EditSeasonModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          season={seasonDetails}
          onSave={handleSaveSeasonDetails}
        />
      )}
    </>
  );
};

export default SeasonDetailPage;
