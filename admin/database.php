<?php
/******************************************************************************
 *
 * Subrion - open source content management system
 * Copyright (C) 2015 Intelliants, LLC <http://www.intelliants.com>
 *
 * This file is part of Subrion.
 *
 * Subrion is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Subrion is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Subrion. If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * @link http://www.subrion.org/
 *
 ******************************************************************************/

class iaBackendController extends iaAbstractControllerBackend
{
	protected $_name = 'database';

	protected $_processAdd = false;
	protected $_processEdit = false;

	private $_actions = array('sql', 'export', 'import', 'consistency', 'reset');

	private $_error = false;


	public function __construct()
	{
		ini_get('safe_mode') || set_time_limit(180);

		parent::__construct();

		$iaDbControl = $this->_iaCore->factory('dbcontrol', iaCore::ADMIN);
		$this->setHelper($iaDbControl);
	}

	protected function _gridRead($params)
	{
		$output = array();

		if (!empty($params['table']))
		{
			if ($fields = $this->_iaDb->describe($params['table'], false))
			{
				foreach ($fields as $key => $value)
				{
					$output[] = $value['Field'];
				}
			}
		}

		return $output;
	}

	protected function _indexPage(&$iaView)
	{
		$page = isset($this->_iaCore->requestPath[0]) && in_array($this->_iaCore->requestPath[0], $this->_actions) ? $this->_iaCore->requestPath[0] : $this->_actions[0];
		$this->_checkActions($page, $iaView);

		switch ($page)
		{
			default:
				$pageCaption = iaLanguage::get('sql_management');
				$this->_queryPage($iaView);

				break;

			case 'export':
				$pageCaption = iaLanguage::get('export');
				$this->_exportPage($iaView);

				break;

			case 'import':
				$pageCaption = iaLanguage::get('import');
				$this->_importPage($iaView);

				break;

			case 'consistency':
				$pageCaption = iaLanguage::get('consistency');
				$this->_consistencyPage($iaView);

				break;

			case 'reset':
				$pageCaption = iaLanguage::get('reset');
				$this->_resetPage($iaView);
		}

		if ($this->getMessages())
		{
			$iaView->setMessages($this->getMessages(), $this->_error ? iaView::ERROR : iaView::SUCCESS);
		}

		$iaView->assign('action', $page);

		iaBreadcrumb::toEnd($pageCaption, IA_SELF);
		$iaView->title($pageCaption);

		$iaView->display($this->getName());
	}


	private function _exportPage(&$iaView)
	{
		$dirname = IA_HOME . $this->_iaCore->get('backup');

		if (!is_writable($dirname))
		{
			$iaView->assign('unable_to_save', true);
			$iaView->setMessages(iaLanguage::getf('directory_not_writable', array('directory' => $dirname)), iaView::ALERT);
		}

		if (isset($_POST['export']))
		{
			if (empty($_POST['tbl']))
			{
				$this->addMessage('export_tables_incorrect');
			}
			else
			{
				$out = '#  MySQL COMMON INFORMATION:' . PHP_EOL;
				$out .= '#  MySQL CLIENT INFO: ' . $this->_iaDb->getInfo('client_info') . PHP_EOL;
				$out .= '#  MySQL HOST INFO: ' . $this->_iaDb->getInfo('host_info') . PHP_EOL;
				$out .= '#  MySQL PROTOCOL VERSION: ' . $this->_iaDb->getInfo('proto_info') . PHP_EOL;
				$out .= '#  MySQL SERVER VERSION: ' . $this->_iaDb->getInfo('server_info') . PHP_EOL . PHP_EOL;
				$out .= '#  __MySQL DUMP GENERATED BY INTELLI__ #' . PHP_EOL . PHP_EOL . PHP_EOL;

				$drop = iaUtil::checkPostParam('drop', 0);
				$showColumns = iaUtil::checkPostParam('showcolumns', 0);
				$useRealPrefix = iaUtil::checkPostParam('real_prefix', 0);

				$sql = '';
				if (isset($_POST['sql_structure']) && empty($_POST['sql_data']))
				{
					if (!empty($_POST['tbl']) && is_array($_POST['tbl']))
					{
						foreach ($_POST['tbl'] as $value)
						{
							$sql.= $this->getHelper()->makeStructureBackup($value, $drop, $useRealPrefix);
						}
					}
					else
					{
						$sql = $this->getHelper()->makeDbStructureBackup($drop, $useRealPrefix);
					}
				}
				elseif (isset($_POST['sql_data']) && empty($_POST['sql_structure']))
				{
					if (!empty($_POST['tbl']) && is_array($_POST['tbl']))
					{
						foreach ($_POST['tbl'] as $value)
						{
							$sql .= $this->getHelper()->makeDataBackup($value, $showColumns, $useRealPrefix);
						}
					}
					else
					{
						$sql = $this->getHelper()->makeDbDataBackup($showColumns, $useRealPrefix);
					}
				}
				elseif (isset($_POST['sql_structure']) && isset($_POST['sql_data']))
				{
					if (!empty($_POST['tbl']) && is_array($_POST['tbl']))
					{
						foreach ($_POST['tbl'] as $value)
						{
							$sql .= $this->getHelper()->makeFullBackup($value, $drop, $showColumns, $useRealPrefix);
						}
					}
					else
					{
						$sql = $this->getHelper()->makeDbBackup($drop, $showColumns, $useRealPrefix);
					}
				}
				$sql = $out . $sql;

				if (isset($_POST['save_file']) && $_POST['save_file'])
				{
					$dumpFile = $dirname;

					// saves to server
					if ('server' == $_POST['savetype'])
					{
						$dumpFile .= !empty($_POST['tbl']) ? date('Y-m-d') . '-' . $_POST['tbl'][0] . '.sql' : 'db-' . date('Y-m-d') . '.sql';
						$fileName = str_replace(IA_HOME, '', $dumpFile);

						if (!$fd = @fopen($dumpFile, 'w'))
						{
							@chmod($dumpFile, 0775);

							$this->_error = true;
							$this->addMessage(iaLanguage::getf('cant_open_sql', array('filename' => $fileName)), false);
						}
						elseif (false === fwrite($fd, $sql))
						{
							fclose($fd);

							$this->_error = true;
							$this->addMessage(iaLanguage::getf('cant_write_sql', array('filename' => $fileName)), false);
						}
						else
						{
							$tbls = '';
							if (!empty($_POST['tbl']))
							{
								$tbls = implode(', ', $_POST['tbl']);
							}

							fclose($fd);

							$this->addMessage(iaLanguage::getf('table_dumped', array('table' => $tbls, 'filename' => $fileName)), false);
						}
					}
					elseif ('client' == $_POST['savetype'])
					{
						$iaView->set('nodebug', 1);

						$dumpFile = ($_POST['tbl']) ? date(iaDb::DATE_FORMAT) . '-' . $_POST['tbl'][0] . '.sql' : 'db_' . date('Y-m-d') . '.sql';

						header('Content-Type: text/plain');
						header('Content-Disposition: attachment; filename="' . $dumpFile . '"');
						echo $sql;

						exit();
					}
				}
				else
				{
					$iaView->assign('outerSql', $sql);
				}
			}
		}

		$iaView->assign('tables', $this->getHelper()->getTables());
	}

	private function _queryPage(&$iaView)
	{
		if (isset($_SESSION['queries']))
		{
			$iaView->assign('history', $_SESSION['queries']);
		}

		if (isset($_POST['exec_query']))
		{
			iaUtil::loadUTF8Functions('ascii', 'validation', 'bad', 'utf8_to_ascii');

			$sql = $_POST['query'];
			$outerData = '';

			utf8_is_valid($sql) || $sql = utf8_bad_replace($sql);

			$queries = (false === strpos($sql, ';' . PHP_EOL))
				? array($sql)
				: explode(";\r\n", $sql);

			foreach ($queries as $key => $sqlQuery)
			{
				$sql = trim(str_replace('{prefix}', $this->_iaDb->prefix, $sqlQuery));

				$this->_iaCore->startHook('phpAdminBeforeRunSqlQuery', array('query' => $sql));

				$result = $this->_iaDb->query($sql);

				$this->_iaCore->startHook('phpAdminAfterRunSqlQuery');

				$numrows = 0;
				if ($result)
				{
					isset($_SESSION['queries']) || $_SESSION['queries'] = array();

					if (!in_array($sqlQuery, $_SESSION['queries']))
					{
						if (count($_SESSION['queries']) >= 5)
						{
							array_shift($_SESSION['queries']);
						}
						$_SESSION['queries'][] = $sqlQuery;
					}

					$numrows = $rows = $this->_iaDb->getNumRows($result);
					if ($rows)
					{
						$rows .= ($rows > 1) ? ' rows' : ' row';
						$this->addMessage("<b>Query OK:</b> $rows selected.", false);
					}
					else
					{
						$this->addMessage('<b>Query OK:</b> ' . $this->_iaDb->getAffected() . ' rows affected.', false);
					}
				}
				else
				{
					$this->_error = true;
					$this->addMessage('<b>Query Failed:</b><br />' . $this->_iaDb->getError());
				}

				if ($numrows)
				{
					// get field names
					$fieldNames = $this->_iaDb->getFieldNames($result);

					$outerData .= '<table class="table table-hover table-condensed"><thead><tr>';
					$i = 0;
					foreach ($fieldNames as $field)
					{
						$outerData .= '<th ' . (!$i ? 'class="first"' : '') . '>' . $field->name . '</th>';
						$i++;
					}
					$outerData .= '</tr></thead><tbody>';

					$numFields = $this->_iaDb->getNumFields($result);
					while ($row = $this->_iaDb->fetchRow($result))
					{
						$outerData .= '<tr>';
						for ($i = 0; $i < $numFields; $i++)
						{
							$outerData .= '<td' . (!$i ? ' class="first"' : '') . '>' . iaSanitize::html($row[$i]) . '</td>';
						}
						$outerData .= '</tr>';
					}
					$outerData .= '</tbody></table>';
				}
			}

			$iaView->assign('sql', $sql);
			$iaView->assign('queryOut', $outerData);
		}

		$iaView->assign('tables', $this->getHelper()->getTables());
	}

	private function _checkActions($page, &$iaView)
	{
		$iaAcl = $this->_iaCore->factory('acl');

		$adminActions = $iaView->getValues('admin_actions');
		foreach ($this->_actions as $index => $action)
		{
			if (!$iaAcl->checkAccess($this->getName() . $action))
			{
				unset($adminActions['db_' . $action], $this->_actions[$index]);
			}
		}

		$iaView->assign('admin_actions', $adminActions);

		if (!$iaAcl->checkAccess($this->getName() . $page))
		{
			return iaView::accessDenied();
		}
	}

	private function _resetPage(&$iaView)
	{
		if (isset($_POST['reset']))
		{
			if ($options = iaUtil::checkPostParam('options', array()))
			{
				if (in_array(iaUsers::getItemName(), $options))
				{
					$iaUsers = $this->_iaCore->factory('users');

					$currentMember = $this->_iaDb->row(iaDb::ALL_COLUMNS_SELECTION, iaDb::convertIds(iaUsers::getIdentity()->id), iaUsers::getTable());
					$this->getHelper()->truncate(iaUsers::getTable());
					$this->_iaDb->insert($currentMember, null, iaUsers::getTable());

					$options = array_diff($options, array($iaUsers->getItemName()));
				}

				foreach ($options as $option)
				{
					$this->_iaCore->startHook('phpDbControlBeforeReset', array('option' => $option));
				}

				$this->addMessage('reset_success');
			}
			else
			{
				$this->_error = true;
				$this->addMessage('reset_choose_table');
			}
		}
		else
		{
			$iaView->setMessages(iaLanguage::get('reset_backup_alert'), iaView::ALERT);
		}

		$resetOptions = array(
			'members' => iaLanguage::get('reset') . ' ' . iaLanguage::get('members')
		);
		$this->_iaCore->startHook('phpAdminDatabaseBeforeAll', array('reset_options' => &$resetOptions));

		$iaView->assign('options', $resetOptions);
	}

	private function _consistencyPage(&$iaView)
	{
		if (!empty($_GET['type']))
		{
			if (in_array($_GET['type'], array('optimize', 'repair')))
			{
				$tables = $this->getHelper()->getTables();
				$type = $_GET['type'];
				$query = strtoupper($type) . ' TABLE ';

				foreach ($tables as $tableName)
				{
					$query .= '`' . $tableName . '`,';
				}
				$query = rtrim($query, ',');
				$this->_iaDb->query($query);

				$iaView->setMessages(iaLanguage::get($type . '_complete'), iaView::SUCCESS);

				iaUtil::reload();
			}
			else
			{
				$this->_iaCore->startHook('phpAdminDatabaseConsistencyType', array('type' => $_GET['type']));
			}
		}
	}

	private function _importPage(&$iaView)
	{
		if (isset($_POST['import']))
		{
			$filename = isset($_POST['sqlfile']) ? $_POST['sqlfile'] : '';
			$extension = '';
			if ($_FILES)
			{
				$filename = $_FILES['sql_file']['tmp_name'];
				$extension = end(explode('.', $_FILES['sql_file']['name']));
			}

			if (!is_file($filename))
			{
				$this->_error = true;
				$this->addMessage('no_file');
			}
			elseif ($extension && 'sql' != $extension)
			{
				$this->_error = true;
				$this->addMessage(iaLanguage::getf('cant_open_incorrect_format', array('filename' => $filename)), false);
			}
			elseif (!($f = fopen($filename, 'r')))
			{
				$this->_error = true;
				$this->addMessage(iaLanguage::getf('cant_open_sql', array('filename' => $filename)), false);
			}
			else
			{
				$sql = '';
				while ($s = fgets($f, 10240))
				{
					$s = trim($s);

					if ($s)
					{
						if ($s[0] == '#' || $s[0] == '')
						{
							continue;
						}
					}
					else
					{
						continue;
					}

					if ($s[strlen($s) - 1] == ';')
					{
						$sql .= $s;
					}
					else
					{
						$sql .= $s;
						continue;
					}

					$this->_iaDb->query(str_replace('{prefix}', $this->_iaDb->prefix, $sql));
					$sql = '';
				}

				fclose($f);

				$this->addMessage('upgrade_completed');

				$this->_iaCore->iaCache->clearAll();
			}
		}

		// generate list of available folders for dump files
		$dumpFolders = array(
			'Updates' => IA_HOME . 'updates' . IA_DS
		);
		$packages = $this->_iaDb->onefield('name', "`type` = 'package' AND `status` = 'active'", null, null, 'extras');
		foreach ($packages as $package)
		{
			$dumpFolders[iaLanguage::get($package)] = IA_PACKAGES . $package . IA_DS . 'includes' . IA_DS . 'dumps' . IA_DS;
		}

		// generate list of available dump files
		$dumpFiles = array();
		foreach ($dumpFolders as $name => $path)
		{
			if (is_dir($path))
			{
				$files = scandir($path);
				foreach ($files as $file)
				{
					if (substr($file, 0, 1) != '.' && is_file($path . $file))
					{
						$dumpFiles[$name][] = array(
							'filename' => $path . $file,
							'title' => substr($file, 0, count($file) - 5)
						);
					}
				}
			}
		}

		$iaView->assign('dumpFiles', $dumpFiles);
	}
}