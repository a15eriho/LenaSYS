<?php 
session_start(); 

include_once(dirname(__file__)."/../../Shared/sessions.php");

if (checklogin()) {
	if (isSuperUser($_SESSION["uid"])) {
		include_once(dirname(__file__)."/../../../coursesyspw.php");
		include_once(dirname(__file__)."/../../Shared/database.php");
		pdoConnect();
		$success = true;
		$stmt = $pdo -> prepare('UPDATE `course` SET `coursename` = :2, `visibility` = :3 WHERE `cid` = :1');
		$stmt -> bindParam(':1', $_POST["courseid"]);
		$stmt -> bindParam(':2', $_POST["coursename"]);
		$stmt -> bindParam(':3', $_POST["visibility"]);
		
		if (!$stmt -> execute()) {
			$success = FALSE;
		}

		echo json_encode("Successfully updated course!");
	} else {
		echo json_encode("No write access");
	}
} else {
	echo json_encode("No access");
}

?>